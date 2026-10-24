"use strict";
import type { CallNode, ElseNode, IfNode, Node, ParenthesesNode, ReturnNode, StatementsNode, UnlessNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType, walk } from "../ast/prism";
import { literalType, typesList } from "./literal_types";

// Returned value: a node, null for an implicit nil or a type of a value without a node
type IValue = Node | null | string;

// Scopes which return values don't belong to a method: nested definitions and lambdas
const scopes = ["DefNode", "ClassNode", "ModuleNode", "SingletonClassNode", "LambdaNode"];

// Detect types returned by a method: types of its last expression and of explicit return values.
// Values of if and unless branches are followed, raising branches don't return anything.
// Types are known only if all returned values are literals: 1, "text", nil, Foo.new etc.
export class ReturnUsage {
  constructor(private body: Node | null) {}

  // Types list of returned values, empty string if any of them is unknown
  public detect(): string {
    // A method being written isn't documented as returning nil
    if (!isNode<StatementsNode>(this.body, "StatementsNode")) { return ""; }
    const values: IValue[] = [];
    walk(this.body, (node) => {
      if (scopes.indexOf(nodeType(node)) >= 0) { return false; }
      if (isNode<ReturnNode>(node, "ReturnNode")) { values.push(...this.returnedValues(node)); }
    });
    values.push(...this.values(this.body));
    const types: string[] = [];
    for (const value of values) {
      const type = typeof value === "string" ? value : value ? literalType(value) : "nil";
      if (!type) { return ""; }
      types.push(type);
    }
    return typesList(types);
  }

  // Values an expression evaluates to, null stands for an implicit nil
  private values(node: Node | null): IValue[] {
    if (!node) { return [null]; }
    if (isNode<StatementsNode>(node, "StatementsNode")) {
      return node.body.length ? this.values(node.body[node.body.length - 1]) : [null];
    }
    if (isNode<ParenthesesNode>(node, "ParenthesesNode")) { return this.values(node.body); }
    if (isNode<IfNode>(node, "IfNode")) { return this.values(node.statements).concat(this.values(node.subsequent)); }
    if (isNode<UnlessNode>(node, "UnlessNode")) {
      return this.values(node.statements).concat(this.values(node.elseClause));
    }
    if (isNode<ElseNode>(node, "ElseNode")) { return this.values(node.statements); }
    // Explicit return values are collected separately, raising doesn't return
    if (isNode<ReturnNode>(node, "ReturnNode") || this.isRaise(node)) { return []; }
    return [node];
  }

  // Values of an explicit return: nothing returns nil, several values return an array
  private returnedValues(node: ReturnNode): IValue[] {
    const args = node.arguments_ ? node.arguments_.arguments_ : [];
    if (args.length > 1) { return ["Array"]; }
    return args.length ? [args[0]] : [null];
  }

  // Is node a raise or fail call
  private isRaise(node: Node): boolean {
    return isNode<CallNode>(node, "CallNode") && !node.receiver && ["raise", "fail"].indexOf(node.name) >= 0;
  }
}
