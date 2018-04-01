"use strict";
import { TagWithOptions } from "../entities/tag_with_options";

// @param documentation tag
export class ParamTag extends TagWithOptions {
  constructor(params: ParamTag = {} as ParamTag) {
    super(params);

    const {
      tagName = "param",
    } = params;

    this.tagName = tagName;
  }
}
