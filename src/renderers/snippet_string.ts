"use strict";
import { SnippetString, workspace, WorkspaceConfiguration } from "vscode";
import { Author } from "../entities/author";
import { Directive } from "../entities/directive";
import { Overload } from "../entities/overload";
import { Raw } from "../entities/raw";
import { Tag } from "../entities/tag";
import { TagOption } from "../entities/tag_option";
import { TagWithOptions } from "../entities/tag_with_options";
import { TagWithTypes } from "../entities/tag_with_types";
import { Text } from "../entities/text";
import { Yield } from "../entities/yield";
import { IEntity } from "../types";
import { SpacerHelper } from "./snippet_string/spacer_helper";

// Rendering options overriding settings
export interface IRenderOptions {
  // Print param name before its type, 'yard.tags.paramNameBeforeType' setting is used if undefined
  paramNameBeforeType?: boolean;
}

// Render documentation tree into a snippet
export class Renderer {
  private snippet = new SnippetString();
  private spacer = new SpacerHelper(this.snippet, this.eol);
  private config: WorkspaceConfiguration;
  // Number of a next placeholder
  private tabstop = 1;
  // Placeholder numbers by link keys
  private links: { [key: string]: number } = {};

  constructor(private entities: IEntity[], private eol: string, private options: IRenderOptions = {}) {
    this.config = workspace.getConfiguration("yard.tags");
  }

  // Render entities and return documentation snippet.
  // Spacers settings add empty lines around entities unless entities already contain them.
  public render(useSpacers: boolean = true): SnippetString {
    this.snippet = new SnippetString();
    this.tabstop = 1;
    this.links = {};
    this.spacer = new SpacerHelper(this.snippet, this.eol);
    this.entities.forEach((entity, index, entities) => {
      if (!this.shouldRenderEntity(entity)) { return; }
      if (useSpacers) { this.spacer.beforeEntity(entity, entities, index); }
      this.renderEntity(entity);
      if (useSpacers) { this.spacer.afterEntity(); }
    });
    return this.decorateSnippet();
  }

  // Is entity should be rendered
  private shouldRenderEntity(entity: IEntity): boolean {
    if (entity.type === "Author" && !this.config.get("author")) { return false; }
    return true;
  }

  // Render a single entity depending of its type
  private renderEntity(entity: IEntity) {
    switch (entity.type) {
      case("Raw"): this.rawEntity(entity as Raw); break;
      case("Tag"): this.tagEntity(entity as Tag); break;
      case("Author"): this.authorEntity(entity as Author); break;
      case("Directive"): this.directiveEntity(entity as Directive); break;
      case("Overload"): this.overloadEntity(entity as Overload); break;
      case("TagOption"): this.tagOptionEntity(entity as TagOption); break;
      case("TagWithOptions"): this.tagWithOptionsEntity(entity as TagWithOptions); break;
      case("TagWithTypes"): this.tagWithTypesEntity(entity as TagWithTypes); break;
      case("Text"): this.textEntity(entity as Text); break;
      case("Yield"): this.yieldEntity(entity as Yield); break;
    }
  }

  // Render an @author tag line
  // @author Name <<email>>
  private authorEntity(entity: Author) {
    this.snippet.appendText("@author ");
    this.textOrPlaceholder(entity.authorName, "<Name>");
    this.snippet.appendText(" <");
    this.textOrPlaceholder(entity.authorEmail, "<email>");
    this.snippet.appendText(">");
    this.spacer.endOfLine();
  }

  // Render a tag line with a text only or a tag without a text
  // @tagName <description>
  private tagEntity(entity: Tag) {
    this.snippet.appendText("@" + entity.tagName);
    if (entity.hasText) {
      this.snippet.appendText(" ");
      this.textOrPlaceholder(entity.text, "<description>");
    }
    this.spacer.endOfLine();
  }

  // Render a directive line followed by its nested documentation indented without spacers
  // @!directiveName signature
  //   <Description>
  private directiveEntity(entity: Directive) {
    this.snippet.appendText("@!" + entity.directiveName + " " + entity.signature);
    this.spacer.endOfLine();
    this.nestedEntities(entity.entities);
  }

  // Render an overload signature line followed by its nested documentation indented without spacers
  // @overload name(params)
  //   @param name [types] <description>
  private overloadEntity(entity: Overload) {
    this.snippet.appendText("@" + entity.tagName + " " + entity.methodName);
    if (entity.params.length > 0) {
      this.snippet.appendText("(");
      entity.params.forEach((param, index) => {
        if (index > 0) { this.snippet.appendText(", "); }
        this.snippet.appendText(param.prefix);
        this.nameOrLinkedPlaceholder(param);
        if (param.keyword) { this.snippet.appendText(":"); }
        if (param.defaultValue === undefined) { return; }
        this.snippet.appendText(param.keyword ? " " : " = ");
        this.textOrPlaceholder(param.defaultValue, "<default>");
      });
      this.snippet.appendText(")");
    }
    this.spacer.endOfLine();
    this.nestedEntities(entity.entities);
  }

  // Render nested entities indented without spacers
  private nestedEntities(entities: IEntity[]) {
    const start = this.snippet.value.length;
    entities.forEach((nested) => { if (this.shouldRenderEntity(nested)) { this.renderEntity(nested); } });
    const nested = this.snippet.value.slice(start).split(this.eol)
      .map((line) => line ? "  " + line : line).join(this.eol);
    this.snippet.value = this.snippet.value.slice(0, start) + nested;
  }

  // Render an @option tag line
  // @option paramName [types] :<key> (default) <description>
  private tagOptionEntity(entity: TagOption) {
    this.snippet.appendText("@option " + entity.paramName);
    this.typesList(entity.types, entity.typesPlaceholder);
    this.snippet.appendText(" :");
    this.textOrPlaceholder(entity.key, "<key>");
    if (entity.defaultValue) { this.snippet.appendText(" (" + entity.defaultValue + ")"); }
    this.snippet.appendText(" ");
    this.textOrPlaceholder(entity.text, "<description>");
    this.spacer.endOfLine();
  }

  // Render a tag with a types and options line
  // @tagName [types] name <description>
  // @option paramName [types] :<key> <description>
  private tagWithOptionsEntity(entity: TagWithOptions) {
    this.tagWithTypesEntity(entity);
    entity.options.forEach((option) => { this.tagOptionEntity(option); });
  }

  // Render a tag with a types line
  // @tagName [types] name <description>
  private tagWithTypesEntity(entity: TagWithTypes) {
    this.snippet.appendText("@" + entity.tagName);
    if (this.paramNameBeforeType()) {
      this.spacedName(entity);
      this.typesList(entity.types, entity.typesPlaceholder);
    } else {
      this.typesList(entity.types, entity.typesPlaceholder);
      this.spacedName(entity);
    }
    this.snippet.appendText(" ");
    this.textOrPlaceholder(entity.text, "<description>");
    this.spacer.endOfLine();
  }

  // Render a yield tag line followed by block params and block return value lines
  // @yield [names] <description>
  // @yieldparam name [types] <description>
  // @yieldreturn [types] <description>
  private yieldEntity(entity: Yield) {
    this.snippet.appendText("@" + entity.tagName);
    if (entity.yieldParams.length > 0) {
      this.snippet.appendText(" [");
      entity.yieldParams.forEach((param, index) => {
        if (index > 0) { this.snippet.appendText(", "); }
        this.nameOrLinkedPlaceholder(param);
      });
      this.snippet.appendText("]");
    }
    this.snippet.appendText(" ");
    this.textOrPlaceholder(entity.text, "<description>");
    this.spacer.endOfLine();
    entity.yieldParams.forEach((param) => { this.tagWithTypesEntity(param); });
    if (entity.yieldReturn) { this.tagWithTypesEntity(entity.yieldReturn); }
  }

  // Render lines of an existing documentation as they're written
  private rawEntity(entity: Raw) {
    entity.lines.forEach((line) => {
      this.snippet.appendText(line);
      this.spacer.endOfLine();
    });
  }

  // Render a descriptive text line
  // <Description>
  private textEntity(entity: Text) {
    this.textOrPlaceholder(entity.text, "<Description>");
    this.spacer.endOfLine();
  }

  // Render a text or a placeholder if text is empty
  private textOrPlaceholder(text: string, placeholder: string) {
    if (text) {
      this.snippet.appendText(text);
    } else {
      this.placeholder(placeholder);
    }
  }

  // Is param name printed before its type
  private paramNameBeforeType(): boolean {
    const option = this.options.paramNameBeforeType;
    return option !== undefined ? option : !!this.config.get("paramNameBeforeType");
  }

  // Render a placeholder. Placeholders of the same link key share a number and are filled in together.
  private placeholder(value: string, link?: string) {
    let tabstop = link ? this.links[link] : undefined;
    if (tabstop === undefined) {
      tabstop = this.tabstop++;
      if (link) { this.links[link] = tabstop; }
    }
    this.snippet.appendPlaceholder(value, tabstop);
  }

  // Render a spaced entity name if it's known or linked
  private spacedName(entity: TagWithTypes) {
    if (!entity.name && !entity.nameLink) { return; }
    this.snippet.appendText(" ");
    this.nameOrLinkedPlaceholder(entity);
  }

  // Render an entity name or a linked placeholder if name is unknown
  private nameOrLinkedPlaceholder(entity: { name: string; nameLink: string }) {
    if (entity.name) {
      this.snippet.appendText(entity.name);
    } else {
      this.placeholder("<name>", entity.nameLink);
    }
  }

  // Render entity types list
  // [types]
  private typesList(types: string, placeholder?: string) {
    this.snippet.appendText(" [");
    this.textOrPlaceholder(types, placeholder || "<Type>");
    this.snippet.appendText("]");
  }

  // Decorate the snippet and return a rebuilt one.
  // Snippet is prepended with a comment symbol, also consecutive empty lines are stripped.
  private decorateSnippet() {
    let lines: string[] = this.snippet.value.split(this.eol);
    lines = lines.filter((element, position, array) => {
      const isRepeatedEmptyLine = position > 0 && element === "" && array[position - 1] === "";
      return !isRepeatedEmptyLine && position < array.length - 1;
    });
    const decoratedLines: string = lines
      .map((line) => "#" + (line ? " " + line : ""))
      .join(this.eol) + this.eol;
    return new SnippetString(decoratedLines);
  }
}
