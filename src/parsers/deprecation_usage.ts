"use strict";
import type { AssocNode, CallNode, InterpolatedStringNode, KeywordHashNode, Node, StringNode, SymbolNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType, walkScope } from "../ast/prism";

// Detect deprecation warnings in a method body: warn "foo is deprecated", warn(message, category: :deprecated),
// calls of deprecators like ActiveSupport::Deprecation.warn(message) and MyGem.deprecator.warn(message).
// Warnings of other objects like logger.warn(message) aren't deprecations.
export class DeprecationUsage {
  constructor(private body: Node | null) {}

  // Does method body warn about its deprecation
  public detect(): boolean {
    let found = false;
    walkScope(this.body, (node) => {
      if (!found && this.isDeprecationWarning(node)) { found = true; }
    });
    return found;
  }

  // Is node a warn call about a deprecation
  private isDeprecationWarning(node: Node): boolean {
    if (!isNode<CallNode>(node, "CallNode") || node.name !== "warn") { return false; }
    const receiver = node.receiver ? node.receiver.location.slice() : "";
    if (/deprecat/i.test(receiver)) { return true; }
    if (receiver && receiver.replace(/^::/, "") !== "Kernel") { return false; }
    const args = node.arguments_ ? node.arguments_.arguments_ : [];
    return /deprecat/i.test(this.stringValue(args[0])) || args.some((arg) => this.isDeprecatedCategory(arg));
  }

  // Text of a string literal without interpolated parts, empty for other nodes
  private stringValue(node: Node | undefined): string {
    if (isNode<StringNode>(node, "StringNode")) { return node.unescaped.value; }
    if (isNode<InterpolatedStringNode>(node, "InterpolatedStringNode")) {
      return node.parts.map((part) => this.stringValue(part)).join("");
    }
    return "";
  }

  // Is node a category: :deprecated keyword argument
  private isDeprecatedCategory(node: Node): boolean {
    if (!isNode<KeywordHashNode>(node, "KeywordHashNode")) { return false; }
    return node.elements.some((element) => isNode<AssocNode>(element, "AssocNode") &&
      this.symbolName(element.key) === "category" && this.symbolName(element.value) === "deprecated");
  }

  // Name of a symbol literal, undefined for other nodes
  private symbolName(node: Node): string | undefined {
    return nodeType(node) === "SymbolNode" ? (node as SymbolNode).unescaped.value : undefined;
  }
}
