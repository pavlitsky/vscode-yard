"use strict";
import { ParserResolver } from "./parsers/resolver";
import { Renderer } from "./renderers/snippet_string";

// Build documentation snippet
export class Builder {

  constructor(private text: string, private eol: string) {}

  // Build and return documentation snippet
  public build() {
    const parser = (new ParserResolver(this.text)).resolve();
    if (!parser) { return; }
    const renderer = new Renderer(parser.parse(), this.eol);
    return renderer.render();
  }
}
