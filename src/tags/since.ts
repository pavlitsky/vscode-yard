"use strict";
import { Tag } from "../entities/tag";

// @since documentation tag, its version is a placeholder prefilled with a gem version
export class SinceTag extends Tag {
  constructor(params: Partial<SinceTag> = {}) {
    super(params);

    const {
      tagName = "since",
      textPlaceholder = "<version>",
    } = params;

    this.tagName = tagName;
    this.textPlaceholder = textPlaceholder;
  }
}
