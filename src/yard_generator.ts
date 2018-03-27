"use strict";
import { EndOfLine, Position, TextEditor, TextLine, window } from "vscode";
import documenterResolver from "./documenter_resolver";

// Generate YARD comment
export default class YardGenerator {
  private editor: TextEditor;
  private position: Position;
  private line: TextLine;
  private lineText: string;
  private eol: string;

  // Build and insert documentation snippet
  public generate() {
    // Update current editor, line, cursor position
    this.updateContext();

    // Check if generator should run
    if (!this.shouldRun()) { return; }

    // Resolve documenter by current line's content
    const documenter = (new documenterResolver(this.lineText)).resolve();
    if (!documenter) { return; }

    // Insert documentation snippet
    return this.editor.insertSnippet(
      documenter.buildSnippet(this.eol), this.snippetPosition(),
    );
  }

  private updateContext(textEditor?: TextEditor) {
    this.editor = textEditor || window.activeTextEditor;
    if (this.editor) {
      this.position = this.editor.selection.active;
      this.line = this.editor.document.lineAt(this.position);
      this.lineText = this.line.text;
      this.eol = this.editor.document.eol === EndOfLine.LF ? "\n" : "\r\n";
    }
  }

  // Get position for a snippet
  private snippetPosition(): Position {
    return this.position.with({character: this.line.firstNonWhitespaceCharacterIndex});
  }

  // Check if previous line already has some comment
  private commentExists(): boolean {
    if (this.line.lineNumber === 0) { return false; }
    const prevLinePosition = this.position.with({line: this.line.lineNumber - 1});
    const prevLine = this.editor.document.lineAt(prevLinePosition);
    return prevLine.text.trim().startsWith("#");
  }

  // Is generator should run
  private shouldRun(): boolean {
    return this.editor &&
      this.editor.document.languageId === "ruby" &&
      !this.commentExists();
  }
}
