"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseError } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };
import { neighbourStatements, walk } from "../ast/prism";
import { IBaseParser } from "./definitions/base_parser";
import definitions_parsers from "./definitions_parsers";
import { isSig } from "./signatures/sorbet";

// Get first suitable parser for a definition starting on a specified line.
// Definitions are looked up from the outermost one, the same way YARD attaches comments.
// A line of Sorbet sig resolves a definition following the sig.
export class ParserResolver {

  // Syntax errors of a document let parsers tell malformed definitions
  constructor(private root: Node, private line: number, private errors: ParseError[] = []) { }

  // Instantiate each parser for nodes starting on the line and check if it's ready to parse the node
  public resolve(): IBaseParser | undefined {
    let resolved: IBaseParser | undefined;
    let sig: Node | undefined;
    walk(this.root, (node) => {
      if (resolved || !this.containsLine(node)) { return false; }
      if (node.location.startLine() !== this.line) { return; }
      if (!sig && isSig(node)) { sig = node; }
      const { previous } = neighbourStatements(this.root, node);
      for (const parser of definitions_parsers) {
        const p = new parser(node, { errors: this.errors, previous });
        if (p.isApplicable()) {
          resolved = p;
          return false;
        }
      }
    });
    if (!resolved && sig) {
      const { next } = neighbourStatements(this.root, sig);
      if (next) { return (new ParserResolver(this.root, next.location.startLine(), this.errors)).resolve(); }
    }
    return resolved;
  }

  // Is the line within node's location
  private containsLine(node: Node): boolean {
    return node.location.startLine() <= this.line && this.line <= node.location.endLine();
  }
}
