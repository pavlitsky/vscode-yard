"use strict";
import { Tag } from "./tag";

// Tag extended with its types list
export class TagWithTypes extends Tag {
  public types?: string;
  public defaultValue?: string;
  public type?: string;

  constructor(params: TagWithTypes = {} as TagWithTypes) {
    super(params);

    const {
      types = "",
      defaultValue = "",
      type = "TagWithTypes",
    } = params;

    this.types = types;
    this.defaultValue = defaultValue;
    this.type = type;
  }
}
