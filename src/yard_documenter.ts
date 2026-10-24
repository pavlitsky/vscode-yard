"use strict";
import { EndOfLine, Position, Range, TextEditor, TextLine, window, workspace } from "vscode";
import { CommentBlocks, ICommentBlock } from "./ast/comments";
import { loadParser } from "./ast/prism";
import { Builder } from "./builder";
import { GitAuthorResolver } from "./resolvers/git_author";
import { IParseContext } from "./types";

// Generate YARD comment or update an existing one
export default class YardDocumenter {
  private editor: TextEditor;
  private line: TextLine;
  private eol: string;

  // Build and insert documentation snippet
  public async generate() {
    // Update current editor, line, cursor position
    this.updateContext();
    if (!this.editor) { return; }

    // Parse document and find comments. Cursor within a comment refers to a definition right below the comment.
    const document = this.editor.document;
    const tree = (await loadParser())(document.getText());
    const comments = new CommentBlocks(tree, (line) => document.lineAt(line - 1).firstNonWhitespaceCharacterIndex);
    const cursorBlock = comments.at(this.line.lineNumber + 1);
    if (cursorBlock) {
      if (cursorBlock.endLine >= document.lineCount) { return; }
      this.line = document.lineAt(cursorBlock.endLine);
    }

    // Resolve documenter by a definition starting on the line
    const builder = new Builder(tree, this.line.lineNumber + 1, this.eol);
    if (builder.isMalformed()) {
      window.setStatusBarMessage("YARD: method signature has syntax errors", 5000);
      return;
    }
    const existing = comments.above(this.line.lineNumber + 1);
    if (existing && !builder.supportsUpdate()) { return; }
    const context = await this.parseContext(builder);

    // Update existing documentation or insert a new one
    if (existing) {
      const updated = builder.update(existing.lines, context);
      if (!updated) { return; }
      return this.editor.insertSnippet(updated, this.commentRange(existing));
    }
    const snippet = builder.build(context);
    if (!snippet) { return; }
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

  private updateContext() {
    this.editor = window.activeTextEditor;
    if (this.editor) {
      this.line = this.editor.document.lineAt(this.editor.selection.active);
      this.eol = this.editor.document.eol === EndOfLine.LF ? "\n" : "\r\n";
    }
  }

  // Get position for a snippet
  private snippetPosition(): Position {
    return new Position(this.line.lineNumber, this.line.firstNonWhitespaceCharacterIndex);
  }

  // Range of an existing comment, it ends where the definition starts the same way a new snippet is inserted
  private commentRange(block: ICommentBlock): Range {
    const firstLine = this.editor.document.lineAt(block.startLine - 1);
    return new Range(firstLine.lineNumber, firstLine.firstNonWhitespaceCharacterIndex,
      this.line.lineNumber, this.line.firstNonWhitespaceCharacterIndex);
  }
}
