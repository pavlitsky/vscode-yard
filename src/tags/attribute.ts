"use strict";
import { Directive } from "../entities/directive";

// @attribute documentation directive
export class AttributeTag extends Directive {
  constructor(params: AttributeTag = {} as AttributeTag) {
    super(params);

    const {
      tagName = "attribute",
    } = params;

    this.tagName = tagName;
  }
}
