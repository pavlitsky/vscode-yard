"use strict";
import type { ParseResult } from "./prism";

// Type of a '#' comment, other comments are =begin/=end embedded documents
const INLINE_COMMENT = 0;

// Keys of magic comments Ruby understands, and Sorbet's sigil.
// Prism reports any comment looking like '# key: value' as a magic comment, documentation texts included.
const MAGIC_KEYS = ["coding", "encoding", "frozen_string_literal", "shareable_constant_value", "typed", "warn_indent"];

// Block of consecutive comment lines, line numbers are 1-based
export interface ICommentBlock {
  startLine: number;
  endLine: number;
  // Comments texts starting with '#'
  lines: string[];
}

// Locate blocks of whole line comments. Trailing and magic comments aren't included.
export class CommentBlocks {
  // Comment texts by line numbers
  private comments = new Map<number, string>();

  // Line indentation tells whole line comments from trailing ones
  constructor(result: ParseResult, indentation: (line: number) => number) {
    const magicLines = result.magicComments
      .filter((comment) => MAGIC_KEYS.indexOf(comment.startLocation.slice().toLowerCase().replace(/-/g, "_")) >= 0)
      .map((comment) => comment.startLocation.startLine());
    result.comments.forEach((comment) => {
      const line = comment.location.startLine();
      if (comment.type !== INLINE_COMMENT || magicLines.indexOf(line) >= 0) { return; }
      if (comment.location.startColumn() !== indentation(line)) { return; }
      this.comments.set(line, comment.location.slice());
    });
  }

  // Block ending right above a line
  public above(line: number): ICommentBlock | undefined {
    return this.blockEndingAt(line - 1);
  }

  // Block containing a line
  public at(line: number): ICommentBlock | undefined {
    if (!this.comments.has(line)) { return; }
    let endLine = line;
    while (this.comments.has(endLine + 1)) { endLine++; }
    return this.blockEndingAt(endLine);
  }

  // Block ending on a line
  private blockEndingAt(endLine: number): ICommentBlock | undefined {
    if (!this.comments.has(endLine)) { return; }
    let startLine = endLine;
    while (this.comments.has(startLine - 1)) { startLine--; }
    const lines: string[] = [];
    for (let line = startLine; line <= endLine; line++) { lines.push(this.comments.get(line)); }
    return { startLine, endLine, lines };
  }
}
