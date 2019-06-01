"use strict";
import { Tag } from "./tag";

// Directive extends Tag with types specifier and entities list.
export class Directive extends Tag {
  public tagTypes?: string;
  public entities?: Tag[];

  constructor(params: Directive = {} as Directive) {
    super(params);

    const {
      tagTypes = "",
      entities = [],
      type = "Directive",
    } = params;

    this.tagTypes = tagTypes;
    this.entities = entities;
    this.type = type;
  }
}
