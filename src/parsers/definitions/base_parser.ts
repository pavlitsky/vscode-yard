import { IEntity, IParseContext } from "../../types";

// Interface each parser should implement
export interface IBaseParser {
  // Is author info used by this parser
  readonly requiresAuthor?: boolean;
  // Is method body used by this parser
  readonly requiresBody?: boolean;
  isApplicable(): boolean;
  parse(context?: IParseContext): IEntity[];
}
