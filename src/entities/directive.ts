"use strict";
import { Tag } from "./tag";
import { TagWithTypes } from "./tag_with_types";

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
