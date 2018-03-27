"use strict";
import { SnippetBuilder } from "../snippet_builder";
import { IDocumenter } from "./documenter";

// Document a constant
export default class Constant implements IDocumenter {
  // Regexp to extract constant name
  public readonly regExp = /([A-Z_]+)\s*=(.*)/;
  // Constant name
  private parsedName: string = "";
  private sb: SnippetBuilder;

  constructor(text) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, name] = match;
      this.parsedName = name;
    }
  }

  // Is this documenter active for supplied text
  public isApplicable(): boolean {
    return this.parsedName !== "";
  }

  // Build documentation snippet
  public buildSnippet(eol: string) {
    this.sb = new SnippetBuilder(eol);
    this.sb.return();
    return this.sb.build();
  }
}
