"use strict";
import { Tag } from "./tag";

// Tag extended with its types list
export class TagWithTypes extends Tag {
  public types?: string;
  public defaultValue?: string;
  // Key linking name placeholders of the same unknown name, so they're filled in together
  public nameLink?: string;
  public type?: string;

  constructor(params: TagWithTypes = {} as TagWithTypes) {
    super(params);

    const {
      types = "",
      defaultValue = "",
      nameLink = "",
      type = "TagWithTypes",
    } = params;

    this.types = types;
    this.defaultValue = defaultValue;
    this.nameLink = nameLink;
    this.type = type;
  }
}
