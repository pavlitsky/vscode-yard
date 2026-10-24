"use strict";
import { Tag } from "./tag";

// Tag extended with its types list
export class TagWithTypes extends Tag {
  public types: string;
  // Key linking name placeholders of the same unknown name, so they're filled in together
  public nameLink: string;
  // Placeholder of unknown types, '<Type>' if empty
  public typesPlaceholder: string;
  public type: string;

  constructor(params: Partial<TagWithTypes> = {}) {
    super(params);

    const {
      types = "",
      nameLink = "",
      typesPlaceholder = "",
      type = "TagWithTypes",
    } = params;

    this.types = types;
    this.nameLink = nameLink;
    this.typesPlaceholder = typesPlaceholder;
    this.type = type;
  }
}
