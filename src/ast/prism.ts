"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseResult } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };

// Parse Ruby source into a syntax tree
export type ParseFunction = (source: string) => ParseResult;

let parser: Promise<ParseFunction>;

// Load Prism parser once. It's an ES module backed by a WebAssembly build of the Ruby's parser.
export function loadParser(): Promise<ParseFunction> {
  if (!parser) {
    parser = import("@ruby/prism")
      .then((prism) => prism.loadPrism())
      .then((parse) => (source: string) => parse(new TextEncoder().encode(source)));
  }
  return parser;
}

// Type of a node, for example "DefNode"
export function nodeType(node: Node | null): string {
  return node ? node.constructor.name : "";
}

// Is node of a specified type, narrows it to a node class
export function isNode<T extends Node>(node: Node | null, type: string): node is T {
  return nodeType(node) === type;
}

// Visit node and its descendants depth-first, descendants are skipped when visitor returns false
export function walk(node: Node, visitor: (node: Node) => boolean | void) {
  if (visitor(node) === false) { return; }
  node.compactChildNodes().forEach((child) => walk(child, visitor));
}
