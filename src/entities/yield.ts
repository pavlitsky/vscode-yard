"use strict";
import { Tag } from "./tag";
import { TagWithTypes } from "./tag_with_types";

// Yield entity. Extends Tag with block params and block return value.
export class Yield extends Tag {
  public yieldParams?: TagWithTypes[];
  public yieldReturn?: TagWithTypes;

  constructor(params: Yield = {}) {
    super(params);

    const {
      tagName = "yield",
      yieldParams = [],
      yieldReturn,
      type = "Yield",
    } = params;

    this.tagName = tagName;
    this.yieldParams = yieldParams;
    this.yieldReturn = yieldReturn;
    this.type = type;
  }
}
