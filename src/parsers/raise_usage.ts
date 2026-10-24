"use strict";
import type { CallNode, ConstantPathNode, ConstantReadNode, Node, StatementsNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType, walkScope } from "../ast/prism";

// Detect classes of exceptions raised in a method body: raise Foo, raise Foo, "message", raise Foo.new(...).
// Raising a message raises RuntimeError, re-raising with a bare raise is skipped.
// A body which only raises NotImplementedError defines an abstract method.
export class RaiseUsage {
  constructor(private body: Node | null) {}

  // Detect exception class names in order of appearance
  public detect(): string[] {
    const classes: string[] = [];
    walkScope(this.body, (node) => {
      if (!this.isRaise(node)) { return; }
      const name = this.exceptionClass(this.exception(node));
      if (name && classes.indexOf(name) < 0) { classes.push(name); }
    });
    return classes;
  }

  // Is body a single raise of NotImplementedError: raise NotImplementedError, "message"
  public isAbstract(): boolean {
    if (!isNode<StatementsNode>(this.body, "StatementsNode") || this.body.body.length !== 1) { return false; }
    const [statement] = this.body.body;
    if (!this.isRaise(statement)) { return false; }
    return (this.exceptionClass(this.exception(statement)) ?? "").replace(/^::/, "") === "NotImplementedError";
  }

  // Is node a raise or fail call
  private isRaise(node: Node): node is CallNode {
    return isNode<CallNode>(node, "CallNode") && !node.receiver && ["raise", "fail"].indexOf(node.name) >= 0;
  }

  // First argument of a raise call, undefined for a bare re-raise
  private exception(node: CallNode): Node | undefined {
    return node.arguments_ ? node.arguments_.arguments_[0] : undefined;
  }

  // Exception class name of a raise argument, undefined if it's unknown
  private exceptionClass(exception: Node | undefined): string | undefined {
    if (this.isConstant(exception)) { return exception.location.slice(); }
    if (isNode<CallNode>(exception, "CallNode") && exception.name === "new" && this.isConstant(exception.receiver)) {
      return exception.receiver.location.slice();
    }
    if (["StringNode", "InterpolatedStringNode"].indexOf(nodeType(exception)) >= 0) { return "RuntimeError"; }
  }

  // Is node a constant reference: Foo or Foo::Bar
  private isConstant(node: Node | null | undefined): node is ConstantReadNode | ConstantPathNode {
    return ["ConstantReadNode", "ConstantPathNode"].indexOf(nodeType(node)) >= 0;
  }
}
