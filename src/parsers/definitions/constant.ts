"use strict";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse a constant definition into documentation entities
export default class Constant implements IBaseParser {
  // Regexp to extract constant name
  public readonly regExp = /([A-Z_]+)\s*=(.*)/;
  // Constant name
  private parsedName: string = "";

  constructor(text) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, name] = match;
      this.parsedName = name;
    }
  }

  // Is this parser ready to process the text
  public isApplicable(): boolean {
    return this.parsedName !== "";
  }

  // Parse documentation tree
  public parse(): IEntity[] {
    return [new ReturnTag()];
  }
}
