"use strict";

// Item of a docstring: a free text line or a tag with its continuation lines
export interface IDocItem {
  // Tag name without '@', empty string for a text line
  tag: string;
  // Content lines without comment markers
  lines: string[];
  // Name of a param described by @param, @yieldparam or @option tag
  name?: string;
  // Is name written before types ('@param name [Type]'), undefined if it's unknown
  nameFirst?: boolean;
  // Option key of @option tag without a colon
  key?: string;
}

// Parse docstring comments into items. Only tags the extension generates are parsed in details,
// other tags and texts are kept as they're written.
// Tag text continues on next lines indented more than the tag, the same way YARD reads it.
export class DocstringParser {
  constructor(private comments: string[]) {}

  // Parse comments into items
  public parse(): IDocItem[] {
    const contents = this.comments.map((comment) => comment.replace(/^#/, "").replace(/^ /, ""));
    const items: IDocItem[] = [];
    let tag: IDocItem | undefined;
    contents.forEach((line, index) => {
      if (/^@\S/.test(line)) {
        tag = this.parseTag(line);
        items.push(tag);
      } else if (tag && this.continuesTag(contents, index)) {
        tag.lines.push(line);
      } else {
        tag = undefined;
        items.push({ tag: "", lines: [line] });
      }
    });
    return items;
  }

  // Parse a tag line
  private parseTag(line: string): IDocItem {
    const tag = /^@(\S+)/.exec(line)?.[1] ?? "";
    const item: IDocItem = { tag, lines: [line] };
    if (tag === "param" || tag === "yieldparam") {
      const typesFirst = /^@\S+\s+\[[^\]]*\]\s*([^\s[]+)/.exec(line);
      const nameFirst = /^@\S+\s+([^\s[]+)(\s+\[)?/.exec(line);
      if (typesFirst) {
        item.name = typesFirst[1];
        item.nameFirst = false;
      } else if (nameFirst) {
        item.name = nameFirst[1];
        item.nameFirst = nameFirst[2] ? true : undefined;
      }
    } else if (tag === "option") {
      const match = /^@option\s+([^\s[]+)(?:\s+\[[^\]]*\])?\s+:?([^\s(]+)/.exec(line);
      if (match) {
        item.name = match[1];
        item.key = match[2];
      }
    }
    return item;
  }

  // Is line a tag continuation: an indented line or a blank line followed by an indented one
  private continuesTag(contents: string[], index: number): boolean {
    const line = contents[index];
    if (/^\s+\S/.test(line)) { return true; }
    if (line.trim() !== "") { return false; }
    const next = contents.slice(index + 1).find((text) => text.trim() !== "");
    return next !== undefined && /^\s+\S/.test(next);
  }
}
