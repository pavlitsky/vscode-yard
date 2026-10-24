"use strict";
import { Tag } from "../entities/tag";

// @see documentation tag
export class SeeTag extends Tag {
  constructor(params: Partial<SeeTag> = {}) {
    super(params);

    const {
      tagName = "see",
    } = params;

    this.tagName = tagName;
  }
}
