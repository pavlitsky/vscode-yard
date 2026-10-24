"use strict";
import {
  CompletionItem, CompletionItemKind, CompletionItemProvider, EndOfLine, MarkdownString, Position, Range,
  SnippetString, TextDocument, workspace,
} from "vscode";
import { CommentBlocks } from "../ast/comments";
import { loadParser } from "../ast/prism";
import { findGaps, isOverloadable, isRaiseDocumented } from "../docstring/gaps";
import { paramNameBeforeType } from "../docstring/names";
import { DocstringParser, IDocItem } from "../docstring/parser";
import { Author } from "../entities/author";
import { Overload } from "../entities/overload";
import { IBaseParser } from "../parsers/definitions/base_parser";
import { ParserResolver } from "../parsers/resolver";
import { Renderer } from "../renderers/snippet_string";
import { GitAuthorResolver } from "../resolvers/git_author";
import { RaiseTag } from "../tags/raise";
import { IEntity } from "../types";
import { yardTags } from "./yard_tags";

// Tag being typed in a comment: '# @par'
const TAG_PATTERN = /^\s*#\s*(@[\w!]*)$/;
// Name being typed after a tag: '# @param ', '# @param [String] na', '# @raise ['
const NAME_PATTERN = /^\s*#\s*@(param|yieldparam|option|raise)\s+((?:\[[^\]]*\]\s*)?)(\S*)$/;

// Documented definition a completion is requested for
interface IDefinitionContext {
  eol: string;
  parser?: IBaseParser;
  entities: IEntity[];
  items: IDocItem[];
  // Params style of the docstring, setting is used if undefined
  paramNameBeforeType?: boolean;
}

// Complete YARD tags in comments. Tags missing in documentation of a definition below the comment are offered first,
// standard YARD tags follow them. Names are completed after @param, @yieldparam, @option and @raise tags.
export class TagCompletionProvider implements CompletionItemProvider {
  public async provideCompletionItems(document: TextDocument, position: Position):
    Promise<CompletionItem[] | undefined> {
    if (!workspace.getConfiguration("yard.completion").get("enabled")) { return; }
    const prefix = document.lineAt(position).text.slice(0, position.character);
    const tagMatch = TAG_PATTERN.exec(prefix);
    const nameMatch = NAME_PATTERN.exec(prefix);
    if (!tagMatch && !nameMatch) { return; }

    const context = await this.definitionContext(document, position);
    if (!context) { return; }
    if (tagMatch) {
      const range = new Range(position.translate(0, -tagMatch[1].length), position);
      return this.tagItems(context, range).concat(this.standardTagItems(context, range));
    }
    if (!nameMatch) { return; }
    const [, tag, types, name] = nameMatch;
    return this.nameItems(context, tag, types, new Range(position.translate(0, -name.length), position));
  }

  // Parse the document and collect details of a definition documented by a comment at the position
  private async definitionContext(document: TextDocument, position: Position):
    Promise<IDefinitionContext | undefined> {
    const tree = (await loadParser())(document.getText());
    const comments = new CommentBlocks(tree, (line) => document.lineAt(line - 1).firstNonWhitespaceCharacterIndex);
    const block = comments.at(position.line + 1);
    if (!block) { return; }
    // Only standard tags are offered for a malformed definition, its params are a guess
    let parser = (new ParserResolver(tree.value, block.endLine + 1, tree.errors)).resolve();
    if (parser && parser.isMalformed && parser.isMalformed()) { parser = undefined; }
    const items = (new DocstringParser(block.lines)).parse();
    const eol = document.eol === EndOfLine.CRLF ? "\r\n" : "\n";
    let entities: IEntity[] = [];
    if (parser) {
      const authorFromGit = parser.requiresAuthor && workspace.getConfiguration("yard.tags").get("authorFromGit");
      const author = authorFromGit ? await (new GitAuthorResolver(document)).resolve() : undefined;
      const overloads = !!workspace.getConfiguration("yard.tags").get("overload") && isOverloadable(items);
      const trailingComment = (line: number) => comments.trailing(line);
      const commentsWithin = (startLine: number, endLine: number) => comments.within(startLine, endLine);
      const config = workspace.getConfiguration("yard.tags");
      const [see, todos] = [!!config.get("see"), !!config.get("todo")];
      entities = parser.parse({
        author, blocks: true, comments: block.lines, commentsWithin, overloads, see, todos, trailingComment,
      });
    }
    return { entities, eol, items, paramNameBeforeType: paramNameBeforeType(items), parser };
  }

  // Tags missing in documentation of the definition
  private tagItems(context: IDefinitionContext, range: Range): CompletionItem[] {
    const gaps = findGaps(context.items, context.entities);
    const items: CompletionItem[] = [];
    const add = (label: string, detail: string, entity: IEntity) =>
      items.push(this.item(label, detail, this.snippet(context, entity), range, "0" + this.pad(items.length)));

    if (gaps.abstractTag) { add("@abstract", "Abstract method", gaps.abstractTag); }
    if (gaps.deprecatedTag) { add("@deprecated", "Deprecated method", gaps.deprecatedTag); }
    if (gaps.privateTag) { add("@private", "Hidden with :nodoc:", gaps.privateTag); }
    gaps.overloads.forEach((overload) => add("@overload " + this.overloadSignature(overload), "Overload", overload));
    gaps.params.forEach((param) =>
      add("@param " + param.name, param.options.length ? "Param with options" : "Param", param));
    gaps.options.forEach((option) =>
      add("@option " + option.paramName + " :" + option.key, "Option of " + option.paramName, option));
    if (gaps.yieldSection) {
      const names = gaps.yieldSection.yieldParams.map((param) => param.name || "<name>");
      add("@yield" + (names.length ? " [" + names.join(", ") + "]" : ""), "Block", gaps.yieldSection);
    }
    gaps.yieldParams.forEach((param) => add("@yieldparam " + param.name, "Block param", param));
    if (gaps.yieldReturn) { add("@yieldreturn", "Block return value", gaps.yieldReturn); }
    if (gaps.returnTag) { add("@return", "Return value", gaps.returnTag); }
    if (gaps.seeTag) { add("@see " + gaps.seeTag.text, "Overridden method", gaps.seeTag); }
    gaps.todos.forEach((todo) => add("@todo " + todo.text, "TODO note", todo));
    this.raises(context).forEach((exception) =>
      add("@raise [" + exception + "]", "Raised exception", new RaiseTag({ types: exception })));
    const author = context.entities.find((entity) => entity.type === "Author") as Author;
    if (author && author.authorName && !context.items.some((item) => item.tag === "author")) {
      add("@author " + author.authorName + (author.authorEmail ? " <" + author.authorEmail + ">" : ""), "Author", author);
    }
    return items;
  }

  // Overload signature as it's labeled, unknown names are labeled with placeholders
  private overloadSignature(overload: Overload): string {
    const params = overload.params.map((param) => param.prefix + (param.name || "<name>") + (param.keyword ? ":" : "") +
      (param.defaultValue === undefined ? "" : (param.keyword ? " " : " = ") + (param.defaultValue || "<default>")));
    return overload.methodName + (params.length ? "(" + params.join(", ") + ")" : "");
  }

  // Standard YARD tags
  private standardTagItems(context: IDefinitionContext, range: Range): CompletionItem[] {
    const nameFirst = this.paramNameBeforeType(context);
    return yardTags.map((tag) => {
      const snippet = typeof tag.snippet === "string" ? tag.snippet : tag.snippet(nameFirst);
      const item = this.item("@" + tag.name, "YARD tag", new SnippetString("@" + tag.name + snippet), range,
        "1" + tag.name);
      item.kind = CompletionItemKind.Keyword;
      item.documentation = new MarkdownString(tag.documentation);
      return item;
    });
  }

  // Names missing in documentation after a typed tag
  private nameItems(context: IDefinitionContext, tag: string, types: string, range: Range): CompletionItem[] {
    const gaps = findGaps(context.items, context.entities);
    const items: CompletionItem[] = [];
    const add = (label: string, detail: string, snippet: SnippetString) =>
      items.push(this.item(label, detail, snippet, range, "0" + this.pad(items.length)));

    if (tag === "param") {
      gaps.params.forEach((param) => add(param.name, "Param", new SnippetString().appendText(param.name)));
    } else if (tag === "yieldparam") {
      const yieldParams = gaps.yieldSection ? gaps.yieldSection.yieldParams : gaps.yieldParams;
      yieldParams.filter((param) => param.name).forEach((param) =>
        add(param.name, "Block param", new SnippetString().appendText(param.name)));
    } else if (tag === "option" && !types) {
      const options = gaps.options.concat(...gaps.params.map((param) => param.options.filter((option) => option.key)));
      options.forEach((option) => add(option.paramName + " :" + option.key, "Option of " + option.paramName,
        this.snippet(context, option, "@option ")));
    } else if (tag === "raise" && !types) {
      this.raises(context).forEach((exception) => add("[" + exception + "]", "Raised exception",
        new SnippetString().appendText("[" + exception + "] ").appendPlaceholder("<description>")));
    }
    return items;
  }

  // Undocumented classes of exceptions raised by the definition
  private raises(context: IDefinitionContext): string[] {
    const raises = context.parser && context.parser.raises ? context.parser.raises() : [];
    return raises.filter((exception) => !isRaiseDocumented(context.items, exception));
  }

  // Render an entity into a snippet continuing a comment line: the first line has no comment marker
  private snippet(context: IDefinitionContext, entity: IEntity, strippedPrefix: string = ""): SnippetString {
    const renderer = new Renderer([entity], context.eol, { paramNameBeforeType: this.paramNameBeforeType(context) });
    const value = renderer.render(false).value.replace(/^# /, "").replace(/(\r?\n)$/, "");
    return new SnippetString(value.startsWith(strippedPrefix) ? value.slice(strippedPrefix.length) : value);
  }

  // Params style of the docstring or the setting
  private paramNameBeforeType(context: IDefinitionContext): boolean {
    if (context.paramNameBeforeType !== undefined) { return context.paramNameBeforeType; }
    return !!workspace.getConfiguration("yard.tags").get("paramNameBeforeType");
  }

  // Build a completion item
  private item(label: string, detail: string, snippet: SnippetString, range: Range, sortText: string): CompletionItem {
    const item = new CompletionItem(label, CompletionItemKind.Property);
    item.detail = "YARD: " + detail;
    item.insertText = snippet;
    item.range = range;
    item.sortText = sortText;
    item.filterText = label;
    return item;
  }

  // Zero padded number for sorting
  private pad(index: number): string {
    return ("000" + index).slice(-3);
  }
}
