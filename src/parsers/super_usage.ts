"use strict";
import type { ClassNode, Node, SingletonClassNode } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType, walkScope } from "../ast/prism";

// Scopes a method may be defined in, the nearest one tells where super goes
const scopes = ["BlockNode", "ClassNode", "DefNode", "LambdaNode", "ModuleNode", "SingletonClassNode"];

// Detect a method of a superclass overridden by a method calling super
export class SuperUsage {
  constructor(private body: Node | null, private ancestors: Node[]) {}

  // Reference to the overridden method: Parent#name, Parent.name for a class method.
  // Undefined if the method doesn't call super or the superclass isn't known: the method is defined in a module,
  // in a block or the superclass isn't a constant.
  public detect(name: string, isClassMethod: boolean): string | undefined {
    if (!this.callsSuper()) { return; }
    const nested = this.ancestors.filter((node) => scopes.indexOf(nodeType(node)) >= 0).reverse();
    let scope = nested[0];
    let classMethod = isClassMethod;
    if (isNode<SingletonClassNode>(scope, "SingletonClassNode")) {
      if (!isNode(scope.expression, "SelfNode")) { return; }
      scope = nested[1];
      classMethod = true;
    }
    if (!isNode<ClassNode>(scope, "ClassNode")) { return; }
    const superclass = scope.superclass;
    if (["ConstantReadNode", "ConstantPathNode"].indexOf(nodeType(superclass)) < 0) { return; }
    return (superclass as Node).location.slice() + (classMethod ? "." : "#") + name;
  }

  // Does the method body call super
  private callsSuper(): boolean {
    let found = false;
    walkScope(this.body, (node) => {
      if (isNode(node, "SuperNode") || isNode(node, "ForwardingSuperNode")) { found = true; }
    });
    return found;
  }
}
