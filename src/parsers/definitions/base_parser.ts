import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseError } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };
import { IEntity, IParseContext } from "../../types";

// Surroundings of a definition node in a document
export interface IDefinitionSite {
  // Syntax errors of the document
  errors?: ParseError[];
  // Statement preceding the definition, it may be a Sorbet sig
  previous?: Node | null;
  // Nodes containing the definition from the outermost one
  ancestors?: Node[];
}

// Interface each parser should implement
export interface IBaseParser {
  // Is author info used by this parser
  readonly requiresAuthor?: boolean;
  // Can existing documentation be updated by this parser
  readonly supportsUpdate?: boolean;
  isApplicable(): boolean;
  // Line documentation is placed above if it's not the first line of a definition: Sorbet sig preceding a method
  documentationLine?(): number | undefined;
  // Classes of exceptions raised by a definition
  raises?(): string[];
  // Does definition have syntax errors preventing to document it
  isMalformed?(): boolean;
  parse(context?: IParseContext): IEntity[];
}
