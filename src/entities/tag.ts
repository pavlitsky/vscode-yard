"use strict";
import { IEntity } from "../types";

// Common Tag entity. Other tags may extend it with their details.
export class Tag implements IEntity {
  public tagName: string;
  public name: string;
  public text: string;
  // Is tag followed by a text, a placeholder is rendered if text is empty
  public hasText: boolean;
  // Placeholder of an empty text, '<description>' if empty
  public textPlaceholder: string;
  public type: string;

  constructor(params: Partial<Tag> = {}) {
    const {
      tagName = "",
      name = "",
      text = "",
      hasText = true,
      textPlaceholder = "",
      type = "Tag",
    } = params;

    this.tagName = tagName;
    this.name = name;
    this.text = text;
    this.hasText = hasText;
    this.textPlaceholder = textPlaceholder;
    this.type = type;
  }
}
