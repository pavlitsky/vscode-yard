"use strict";
import { Tag } from "../entities/tag";

// @deprecated documentation tag
export class DeprecatedTag extends Tag {
  constructor(params: Partial<DeprecatedTag> = {}) {
    super(params);

    const {
      tagName = "deprecated",
    } = params;

    this.tagName = tagName;
  }
}
