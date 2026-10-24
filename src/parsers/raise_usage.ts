"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType, walkScope } from "../ast/prism";

// Detect classes of exceptions raised in a method body: raise Foo, raise Foo, "message", raise Foo.new(...).
// Raising a message raises RuntimeError, re-raising with a bare raise is skipped.
export class RaiseUsage {
  constructor(private body: Node | null) {}

  // Detect exception class names in order of appearance
  public detect(): string[] {
    const classes: string[] = [];
    walkScope(this.body, (node) => {
      if (!isNode<CallNode>(node, "CallNode") || node.receiver || ["raise", "fail"].indexOf(node.name) < 0) { return; }
      const [exception] = node.arguments_ ? node.arguments_.arguments_ : [];
      const name = this.exceptionClass(exception);
      if (name && classes.indexOf(name) < 0) { classes.push(name); }
    });
    return classes;
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
  private isConstant(node: Node | null | undefined): boolean {
    return ["ConstantReadNode", "ConstantPathNode"].indexOf(nodeType(node)) >= 0;
  }
}
