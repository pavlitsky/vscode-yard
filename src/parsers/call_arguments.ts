"use strict";
import type { AssocNode, CallNode, KeywordHashNode, Node, StringNode, SymbolNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../ast/prism";

// Name given by a symbol or a string literal, empty for other nodes
export function literalName(node: Node | null | undefined): string {
  if (isNode<SymbolNode>(node, "SymbolNode") || isNode<StringNode>(node, "StringNode")) { return node.unescaped.value; }
  return "";
}

// Positional arguments of a call, keyword arguments aren't included
export function positionalArguments(call: CallNode): Node[] {
  return (call.arguments_ ? call.arguments_.arguments_ : []).filter((arg) => !isNode(arg, "KeywordHashNode"));
}

// Keyword arguments of a call by names: delegate :name, to: :user
export function keywordArguments(call: CallNode): { [name: string]: Node } {
  const options: { [name: string]: Node } = {};
  (call.arguments_ ? call.arguments_.arguments_ : []).forEach((arg) => {
    if (!isNode<KeywordHashNode>(arg, "KeywordHashNode")) { return; }
    arg.elements.forEach((element) => {
      if (isNode<AssocNode>(element, "AssocNode") && literalName(element.key)) {
        options[literalName(element.key)] = element.value;
      }
    });
  });
  return options;
}
