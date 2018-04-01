"use strict";
import { TagOption } from "./tag_option";
import { TagWithTypes } from "./tag_with_types";

// Tag extended with options hash.
export class TagWithOptions extends TagWithTypes {
  public options?: TagOption[];
  public type?: string;

  constructor(params: TagWithOptions = {} as TagWithOptions) {
    super(params);

    const {
      options = [],
      type = "TagWithOptions",
    } = params;

    this.options = options;
    this.type = type;
  }
}
