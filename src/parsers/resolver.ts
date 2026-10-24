"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { walk } from "../ast/prism";
import { IBaseParser } from "./definitions/base_parser";
import definitions_parsers from "./definitions_parsers";

// Get first suitable parser for a definition starting on a specified line.
// Definitions are looked up from the outermost one, the same way YARD attaches comments.
export class ParserResolver {

  constructor(private root: Node, private line: number) { }

  // Instantiate each parser for nodes starting on the line and check if it's ready to parse the node
  public resolve(): IBaseParser {
    let resolved: IBaseParser;
    walk(this.root, (node) => {
      if (resolved || !this.containsLine(node)) { return false; }
      if (node.location.startLine() !== this.line) { return; }
      for (const parser of definitions_parsers) {
        const p = new parser(node);
        if (p.isApplicable()) {
          resolved = p;
          return false;
        }
      }
    });
    return resolved;
  }

  // Is the line within node's location
  private containsLine(node: Node): boolean {
    return node.location.startLine() <= this.line && this.line <= node.location.endLine();
  }
}
