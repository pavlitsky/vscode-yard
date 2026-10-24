"use strict";
import type { ParseResult } from "./ast/prism";
import { SnippetString, workspace } from "vscode";
import { DocstringMerger } from "./docstring/merger";
import { DocstringParser } from "./docstring/parser";
import { IBaseParser } from "./parsers/definitions/base_parser";
import { ParserResolver } from "./parsers/resolver";
import { Renderer } from "./renderers/snippet_string";
import { IParseContext } from "./types";

// Build documentation snippet
export class Builder {
  private parser: IBaseParser | undefined;

  constructor(tree: ParseResult, line: number, private eol: string) {
    this.parser = (new ParserResolver(tree.value, line, tree.errors)).resolve();
  }

  // Does definition have syntax errors preventing to document it
  public isMalformed(): boolean {
    return !!this.parser && !!this.parser.isMalformed && this.parser.isMalformed();
  }

  // Line documentation is placed above, undefined if it's the first line of the definition
  public documentationLine(): number | undefined {
    return this.parser && this.parser.documentationLine ? this.parser.documentationLine() : undefined;
  }

  // Is author info used to build the snippet
  public requiresAuthor(): boolean {
    return !!this.parser && !!this.parser.requiresAuthor;
  }

  // Can existing documentation be updated
  public supportsUpdate(): boolean {
    return !!this.parser && !!this.parser.supportsUpdate;
  }

  // Build and return documentation snippet
  public build(context: IParseContext = {}) {
    if (!this.parser) { return; }
    const renderer = new Renderer(this.parser.parse(context), this.eol);
    return renderer.render();
  }

  // Build a snippet of existing documentation comments merged with generated documentation,
  // undefined if documentation is up to date
  public update(comments: string[], context: IParseContext = {}): SnippetString | undefined {
    if (!this.parser?.supportsUpdate) { return; }
    const spacers = workspace.getConfiguration("yard.spacers");
    const merger = new DocstringMerger((new DocstringParser(comments)).parse(), this.parser.parse(context), {
      beforeTags: !!spacers.get("beforeTags"),
      separateTags: !!spacers.get("separateTags"),
    });
    const entities = merger.merge();
    if (!merger.changed) { return; }
    const renderer = new Renderer(entities, this.eol, { paramNameBeforeType: merger.paramNameBeforeType });
    return renderer.render(false);
  }
}
