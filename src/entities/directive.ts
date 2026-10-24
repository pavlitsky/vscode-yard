"use strict";
import { IEntity } from "../types";

// YARD directive with its nested documentation indented below it:
// @!method name(params)
//   <Description>
//   @return [<Type>] <description>
export class Directive implements IEntity {
  // Directive name without '@!': method, attribute
  public directiveName: string;
  // Directive text: method signature or attribute access and name
  public signature: string;
  public entities: IEntity[];
  public type: string;

  constructor(params: Partial<Directive> = {}) {
    const {
      directiveName = "",
      signature = "",
      entities = [],
      type = "Directive",
    } = params;

    this.directiveName = directiveName;
    this.signature = signature;
    this.entities = entities;
    this.type = type;
  }
}
