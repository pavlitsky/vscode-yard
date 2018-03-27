"use strict";
import { SnippetBuilder } from "../snippet_builder";
import { IDocumenter } from "./documenter";

// Document class or module definition
export default class ClassOrModule implements IDocumenter {
  // Regexp to extract class/module type and its name
  public readonly regExp = /(class|module)\s+([\w:])?/;
  // Class/module name and type
  private parsedType: string = "";
  private parsedName: string = "";
  private sb: SnippetBuilder;

  constructor(text) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, type, name] = match;
      this.parsedType = type;
      this.parsedName = name;
    }
  }

  // Is this documenter active for supplied text
  public isApplicable(): boolean {
    return this.parsedType !== "" && this.parsedName !== "";
  }

  // Build documentation snippet
  public buildSnippet(eol: string) {
    this.sb = new SnippetBuilder(eol);
    this.buildDescription();
    this.buildAuthor();
    return this.sb.build();
  }

  // Build description section
  private buildDescription() {
    this.sb.spacer();
    this.sb.description();
    this.sb.spacer();
  }

  // Build @author tag
  private buildAuthor() {
    this.sb.author();
    this.sb.spacer();
  }
}
