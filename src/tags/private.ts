"use strict";
import { Tag } from "../entities/tag";

// @private documentation tag, it has no text
export class PrivateTag extends Tag {
  constructor(params: Partial<PrivateTag> = {}) {
    super(params);

    const {
      tagName = "private",
      hasText = false,
    } = params;

    this.tagName = tagName;
    this.hasText = hasText;
  }
}
