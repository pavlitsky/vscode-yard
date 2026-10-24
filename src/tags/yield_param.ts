"use strict";
import { TagWithTypes } from "../entities/tag_with_types";

// @yieldparam documentation tag
export class YieldParamTag extends TagWithTypes {
  constructor(params: YieldParamTag = {} as YieldParamTag) {
    super(params);

    const {
      tagName = "yieldparam",
    } = params;

    this.tagName = tagName;
  }
}
