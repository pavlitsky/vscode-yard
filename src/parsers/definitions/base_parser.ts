import { IEntity, IParseContext } from "../../types";

// Interface each parser should implement
export interface IBaseParser {
  // Is author info used by this parser
  readonly requiresAuthor?: boolean;
  // Can existing documentation be updated by this parser
  readonly supportsUpdate?: boolean;
  isApplicable(): boolean;
  // Classes of exceptions raised by a definition
  raises?(): string[];
  parse(context?: IParseContext): IEntity[];
}
