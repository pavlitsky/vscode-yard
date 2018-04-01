import { IEntity } from "../../types";

// Interface each parser should implement
export interface IBaseParser {
  isApplicable(): boolean;
  parse(): IEntity[];
}
