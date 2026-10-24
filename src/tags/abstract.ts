"use strict";
import { Tag } from "../entities/tag";

// @abstract documentation tag
export class AbstractTag extends Tag {
  constructor(params: Partial<AbstractTag> = {}) {
    super(params);

    const {
      tagName = "abstract",
    } = params;

    this.tagName = tagName;
  }
}
