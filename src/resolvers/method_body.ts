"use strict";
import { TextDocument, TextLine } from "vscode";

// Collect source lines of a method body following its definition line.
// Body ends on a first line indented same or less than the definition, except rescue/ensure/else clauses.
export class MethodBodyResolver {
  private readonly maxLines = 500;

  constructor(private document: TextDocument, private line: TextLine) {}

  // Resolve body lines, empty for a single line method
  public resolve(): string[] {
    if (this.isSingleLine()) { return []; }
    const indent = this.line.firstNonWhitespaceCharacterIndex;
    const lastLineNumber = Math.min(this.document.lineCount - 1, this.line.lineNumber + this.maxLines);
    const lines: string[] = [];
    for (let lineNumber = this.line.lineNumber + 1; lineNumber <= lastLineNumber; lineNumber++) {
      const line = this.document.lineAt(lineNumber);
      if (line.isEmptyOrWhitespace) { continue; }
      const isOutdented = line.firstNonWhitespaceCharacterIndex <= indent;
      if (isOutdented && !/^(?:rescue|ensure|else)\b/.test(line.text.trim())) { break; }
      lines.push(line.text);
    }
    return lines;
  }

  // Is method defined in a single line: 'def foo; end' or endless 'def foo = bar'
  private isSingleLine(): boolean {
    const text = this.line.text;
    return /\bend\s*$/.test(text) || /^\s*def\s+[\w.?!]+(?:\(.*\))?\s*=\s/.test(text);
  }
}
