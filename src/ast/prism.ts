"use strict";
import type { Node, ProgramNode, StatementsNode } from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseResult as PrismParseResult } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };

// Result of parsing. Prism's declaration of the syntax tree root misses its type, it's declared here.
export type ParseResult = Omit<PrismParseResult, "value"> & { value: ProgramNode };

// Parse Ruby source into a syntax tree
export type ParseFunction = (source: string) => ParseResult;

let parser: Promise<ParseFunction> | undefined;

// Load Prism parser once. It's an ES module backed by a WebAssembly build of the Ruby's parser.
export function loadParser(): Promise<ParseFunction> {
  parser ??= import("@ruby/prism")
    .then((prism) => prism.loadPrism())
    .then((parse) => (source: string) => parse(new TextEncoder().encode(source)));
  return parser;
}

// Type of a node, for example "DefNode"
export function nodeType(node: Node | null | undefined): string {
  return node ? node.constructor.name : "";
}

// Is node of a specified type, narrows it to a node class
export function isNode<T extends Node>(node: Node | null | undefined, type: string): node is T {
  return nodeType(node) === type;
}

// Visit node and its descendants depth-first, descendants are skipped when visitor returns false
export function walk(node: Node, visitor: (node: Node) => boolean | void) {
  if (visitor(node) === false) { return; }
  node.compactChildNodes().forEach((child) => walk(child, visitor));
}

// Nested scopes which local variables and yield of an enclosing method don't belong to
const scopes = ["DefNode", "ClassNode", "ModuleNode", "SingletonClassNode"];

// Visit nodes of a method body skipping nested scopes
export function walkScope(body: Node | null, visitor: (node: Node) => void) {
  if (!body) { return; }
  walk(body, (node) => {
    if (scopes.indexOf(nodeType(node)) >= 0) { return false; }
    visitor(node);
  });
}

// Does node contain other node
function contains(node: Node, other: Node): boolean {
  return node.location.startOffset <= other.location.startOffset &&
    other.location.startOffset + other.location.length <= node.location.startOffset + node.location.length;
}

// Nodes containing a node from the outermost one, the node itself isn't included
export function ancestors(root: Node, node: Node): Node[] {
  const result: Node[] = [];
  walk(root, (current) => {
    if (current === node || !contains(current, node)) { return false; }
    result.push(current);
  });
  return result;
}

// Statements around a statement starting with a node, the node is the statement itself or it's wrapped
// by a call on the same line like 'private def foo'
export function neighbourStatements(root: Node, node: Node): { previous: Node | null; next: Node | null } {
  const result: { previous: Node | null; next: Node | null } = { next: null, previous: null };
  walk(root, (current) => {
    if (!contains(current, node)) { return false; }
    if (!isNode<StatementsNode>(current, "StatementsNode")) { return; }
    const index = current.body.findIndex((statement) =>
      contains(statement, node) && statement.location.startLine() === node.location.startLine());
    if (index < 0) { return; }
    result.previous = current.body[index - 1] ?? null;
    result.next = current.body[index + 1] ?? null;
  });
  return result;
}
