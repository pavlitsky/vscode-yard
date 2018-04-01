"use strict";
import { IEntity } from "../types";

// Common Tag entity. Other tags may extend it with their details.
export class Tag implements IEntity {
  public tagName?: string;
  public name?: string;
  public text?: string;
  public type?: string;

  constructor(params: Tag = {} as Tag) {
    const {
      tagName = "",
      name = "",
      text = "",
      type = "Tag",
    } = params;

    this.tagName = tagName;
    this.name = name;
    this.text = text;
    this.type = type;
  }
}
