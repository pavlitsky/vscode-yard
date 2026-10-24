"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType } from "../ast/prism";

// Types of literal nodes
const literalTypes: { [type: string]: string } = {
  ArrayNode: "Array",
  FalseNode: "Boolean",
  FloatNode: "Float",
  HashNode: "Hash",
  ImaginaryNode: "Complex",
  IntegerNode: "Integer",
  InterpolatedRegularExpressionNode: "Regexp",
  InterpolatedStringNode: "String",
  InterpolatedSymbolNode: "Symbol",
  LambdaNode: "Proc",
  NilNode: "nil",
  RangeNode: "Range",
  RationalNode: "Rational",
  RegularExpressionNode: "Regexp",
  SelfNode: "self",
  StringNode: "String",
  SymbolNode: "Symbol",
  TrueNode: "Boolean",
};

// Type of a literal value or an instantiated class: 1, "text", [], Foo.new, Foo::Bar.new(1).
// Undefined if the type is unknown.
export function literalType(node: Node | null | undefined): string | undefined {
  const type = literalTypes[nodeType(node)];
  if (type) { return type; }
  if (isNode<CallNode>(node, "CallNode") && node.name === "new" &&
    ["ConstantReadNode", "ConstantPathNode"].indexOf(nodeType(node.receiver)) >= 0 && !node.block) {
    return (node.receiver as Node).location.slice();
  }
}

// Types list of default values of a param or an option, empty string if any type is unknown.
// A nil default stands for an optional object.
export function defaultTypes(values: Node[]): string {
  const types = values.map((value) => literalType(value));
  if (types.length === 0 || types.some((type) => !type)) { return ""; }
  const list = typesList(types as string[]);
  return list === "nil" ? "Object, nil" : list;
}

// Join types into a types list, nil goes last: "String, nil"
export function typesList(types: string[]): string {
  const unique = types.filter((type, index) => types.indexOf(type) === index);
  return unique.filter((type) => type !== "nil").concat(unique.indexOf("nil") >= 0 ? ["nil"] : []).join(", ");
}
