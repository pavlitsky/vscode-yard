"use strict";
import { IBaseParser } from "./parsers/definitions/base_parser";
import { ParserResolver } from "./parsers/resolver";
import { Renderer } from "./renderers/snippet_string";
import { IParseContext } from "./types";

// Build documentation snippet
export class Builder {
  private parser: IBaseParser;

  constructor(private text: string, private eol: string) {
    this.parser = (new ParserResolver(this.text)).resolve();
  }

  // Is author info used to build the snippet
  public requiresAuthor(): boolean {
    return !!this.parser && !!this.parser.requiresAuthor;
  }

  // Build and return documentation snippet
  public build(context: IParseContext = {}) {
    if (!this.parser) { return; }
    const renderer = new Renderer(this.parser.parse(context), this.eol);
    return renderer.render();
  }
}
