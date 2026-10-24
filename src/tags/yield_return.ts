"use strict";
import { TagWithTypes } from "../entities/tag_with_types";

// @yieldreturn documentation tag
export class YieldReturnTag extends TagWithTypes {
  constructor(params: YieldReturnTag = {} as YieldReturnTag) {
    super(params);

    const {
      tagName = "yieldreturn",
    } = params;

    this.tagName = tagName;
  }
}
