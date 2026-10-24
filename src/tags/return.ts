"use strict";
import { TagWithTypes } from "../entities/tag_with_types";

// @return documentation tag
export class ReturnTag extends TagWithTypes {
  constructor(params: Partial<ReturnTag> = {}) {
    super(params);

    const {
      tagName = "return",
    } = params;

    this.tagName = tagName;
  }
}
