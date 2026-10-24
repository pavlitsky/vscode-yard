"use strict";
import { EndOfLine, Position, Range, TextDocument, TextLine, window, workspace } from "vscode";
import { CommentBlocks, ICommentBlock } from "./ast/comments";
import { loadParser } from "./ast/prism";
import { Builder } from "./builder";
import { annotationLinesCount } from "./parsers/signatures/method_signature";
import { GitAuthorResolver } from "./resolvers/git_author";
import { IParseContext } from "./types";

// Generate YARD comment or update an existing one
export default class YardDocumenter {
  // Build and insert documentation snippet for a definition at the cursor of an active editor
  public async generate() {
    const editor = window.activeTextEditor;
    if (!editor) { return; }
    const document = editor.document;
    const eol = document.eol === EndOfLine.LF ? "\n" : "\r\n";
    let line = document.lineAt(editor.selection.active);

    // Parse document and find comments. Cursor within a comment refers to a definition right below the comment.
    const tree = (await loadParser())(document.getText());
    const comments = new CommentBlocks(tree, (number) => document.lineAt(number - 1).firstNonWhitespaceCharacterIndex);
    const cursorBlock = comments.at(line.lineNumber + 1);
    if (cursorBlock) {
      if (cursorBlock.endLine >= document.lineCount) { return; }
      line = document.lineAt(cursorBlock.endLine);
    }

    // Resolve documenter by a definition starting on the line
    const builder = new Builder(tree, line.lineNumber + 1, eol);
    if (builder.isMalformed()) {
      window.setStatusBarMessage("YARD: method signature has syntax errors", 5000);
      return;
    }
    // Documentation is placed above Sorbet sig of a definition.
    // Trailing rbs-inline annotations of a comment stay right above the definition, documentation goes above them.
    line = document.lineAt((builder.documentationLine() ?? line.lineNumber + 1) - 1);
    const block = comments.above(line.lineNumber + 1);
    const docLinesCount = block ? block.lines.length - annotationLinesCount(block.lines) : 0;
    const existing = block && docLinesCount > 0 ? { ...block, lines: block.lines.slice(0, docLinesCount) } : undefined;
    if (existing && !builder.supportsUpdate()) { return; }
    const context = await this.parseContext(builder, document, block ? block.lines : [], comments);
    const below = block ? document.lineAt(block.startLine - 1 + docLinesCount) : line;

    // Update existing documentation or insert a new one
    if (existing) {
      const updated = builder.update(existing.lines, context);
      if (!updated) { return; }
      return editor.insertSnippet(updated, this.commentRange(document, existing, below));
    }
    const snippet = builder.build(context);
    if (!snippet) { return; }
    return editor.insertSnippet(snippet, new Position(below.lineNumber, below.firstNonWhitespaceCharacterIndex));
  }

  // Collect environment-dependent details for the builder
  private async parseContext(builder: Builder, document: TextDocument, comments: string[], blocks: CommentBlocks):
    Promise<IParseContext> {
    const config = workspace.getConfiguration("yard.tags");
    const context: IParseContext = {
      blocks: !!config.get("yield"), comments, overloads: !!config.get("overload"), raises: !!config.get("raise"),
      trailingComment: (line) => blocks.trailing(line),
    };
    if (builder.requiresAuthor() && config.get("author") && config.get("authorFromGit")) {
      context.author = await (new GitAuthorResolver(document)).resolve();
    }
    return context;
  }

  // Range of an existing comment, it ends where a line below starts the same way a new snippet is inserted
  private commentRange(document: TextDocument, block: ICommentBlock, line: TextLine): Range {
    const firstLine = document.lineAt(block.startLine - 1);
    return new Range(firstLine.lineNumber, firstLine.firstNonWhitespaceCharacterIndex,
      line.lineNumber, line.firstNonWhitespaceCharacterIndex);
  }
}
