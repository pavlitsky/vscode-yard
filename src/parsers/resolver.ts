"use strict";
import definitions_parsers from "./definitions_parsers";

// Get first suitable parser for a supplied definition line
export class ParserResolver {

  constructor(private line: string) { }

  // Instantiate each parser and check if it's ready to parse the definition line
  public resolve() {
    for (const parser of definitions_parsers) {
      const p = new parser(this.line);
      if (p.isApplicable()) { return p; }
    }
    return undefined;
  }
}
