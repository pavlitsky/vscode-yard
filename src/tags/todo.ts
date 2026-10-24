"use strict";
import { Tag } from "../entities/tag";

// @todo documentation tag
export class TodoTag extends Tag {
  constructor(params: Partial<TodoTag> = {}) {
    super(params);

    const {
      tagName = "todo",
    } = params;

    this.tagName = tagName;
  }
}
