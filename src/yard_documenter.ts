"use strict";
import { EndOfLine, Position, TextEditor, TextLine, window, workspace } from "vscode";
import { loadParser } from "./ast/prism";
import { Builder } from "./builder";
import { GitAuthorResolver } from "./resolvers/git_author";
import { IParseContext } from "./types";

// Generate YARD comment
export default class YardDocumenter {
  private editor: TextEditor;
  private position: Position;
  private line: TextLine;
  private eol: string;

  // Build and insert documentation snippet
  public async generate() {
    // Update current editor, line, cursor position
    this.updateContext();

    // Check if documenter should run
    if (!this.shouldRun()) { return; }

    // Parse document and resolve documenter by a definition starting on the current line
    const parse = await loadParser();
    const tree = parse(this.editor.document.getText());
    const builder = new Builder(tree.value, this.line.lineNumber + 1, this.eol);
    const snippet = builder.build(await this.parseContext(builder));
    if (!snippet) { return; }

    // Insert documentation snippet
    return this.editor.insertSnippet(snippet, this.snippetPosition());
  }

  // Collect environment-dependent details for the builder
  private async parseContext(builder: Builder): Promise<IParseContext> {
    const config = workspace.getConfiguration("yard.tags");
    const context: IParseContext = { blocks: !!config.get("yield") };
    if (builder.requiresAuthor() && config.get("author") && config.get("authorFromGit")) {
      context.author = await (new GitAuthorResolver(this.editor.document)).resolve();
    }
    return context;
  }

  private updateContext(textEditor?: TextEditor) {
    this.editor = textEditor || window.activeTextEditor;
    if (this.editor) {
      this.position = this.editor.selection.active;
      this.line = this.editor.document.lineAt(this.position);
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

  // Is documenter should run
  private shouldRun(): boolean {
    return this.editor && !this.commentExists();
  }
}
