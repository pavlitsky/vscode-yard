"use strict";
import { IEntity } from "../types";
import { Tag } from "./tag";

// Param of an overload signature: name(required, optional = 1, *rest, key:, other: nil, **opts, &block)
export interface IOverloadSignatureParam {
  // Sigil of a splat or a block param: '*', '**', '&'
  prefix: string;
  // Param name, it's a linked placeholder if empty
  name: string;
  // Key linking a name placeholder with names of tags documenting the param
  nameLink: string;
  // Is param a keyword
  keyword: boolean;
  // Default value of an optional param, it's a placeholder if empty. Undefined if param isn't optional.
  defaultValue?: string;
}

// Overload entity: alternative signature of a method with its documentation indented below it
// @overload name(params)
//   @param name [types] <description>
//   @return [types] <description>
export class Overload extends Tag {
  public methodName: string;
  public params: IOverloadSignatureParam[];
  public entities: IEntity[];

  constructor(params: Partial<Overload> = {}) {
    super(params);

    const {
      tagName = "overload",
      methodName = "",
      params: signatureParams = [],
      entities = [],
      type = "Overload",
    } = params;

    this.tagName = tagName;
    this.methodName = methodName;
    this.params = signatureParams;
    this.entities = entities;
    this.type = type;
  }
}
