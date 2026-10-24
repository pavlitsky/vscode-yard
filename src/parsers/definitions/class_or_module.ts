"use strict";
import { AuthorTag } from "../../tags/author";
import { DescriptionTag } from "../../tags/description";
import { IParseContext } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse class or module definition into documentation entities
export default class ClassOrModule implements IBaseParser {
  // Regexp to extract class/module type and its name
  public readonly regExp = /(class|module)\s+([\w:])?/;
  // Author info is used to fill the @author tag
  public readonly requiresAuthor = true;
  // Class/module name and type
  private parsedType: string = "";
  private parsedName: string = "";

  constructor(text: string) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, type, name] = match;
      this.parsedType = type;
      this.parsedName = name;
    }
  }

  // Is this parser ready to process the text
  public isApplicable(): boolean {
    return this.parsedType !== "" && this.parsedName !== "";
  }

  // Parse documentation tree
  public parse(context: IParseContext = {}) {
    const { name = "", email = "" } = context.author || {};
    return [
      new DescriptionTag(),
      new AuthorTag({ authorName: name, authorEmail: email }),
    ];
  }
}
