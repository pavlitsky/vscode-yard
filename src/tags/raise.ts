"use strict";
import { TagWithTypes } from "../entities/tag_with_types";

// @raise documentation tag
export class RaiseTag extends TagWithTypes {
  constructor(params: RaiseTag = {}) {
    super(params);

    const {
      tagName = "raise",
    } = params;

    this.tagName = tagName;
  }
}
