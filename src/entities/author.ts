"use strict";
import { Tag } from "./tag";

// Author entity. Extends Tag with name and email.
export class Author extends Tag {
  public authorName?: string;
  public authorEmail?: string;

  constructor(params: Author = {} as Author) {
    super(params);

    const {
      tagName = "author",
      authorName = "",
      authorEmail = "",
      type = "Author",
    } = params;

    this.tagName = tagName;
    this.authorName = authorName;
    this.authorEmail = authorEmail;
    this.type = type;
  }
}
