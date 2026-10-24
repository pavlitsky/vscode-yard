"use strict";
import type { BlockNode, CallNode, LambdaNode } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { literalName, positionalArguments } from "../call_arguments";
import { DirectiveMethod } from "./directive_method";

// Rails scope documented as a class method returning a relation: scope :active, -> { where(active: true) }
export default class Scope extends DirectiveMethod {
  // Is this parser ready to process the node
  public override isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode") || this.node.receiver || this.node.name !== "scope") { return false; }
    return !!this.methodName && !!this.callable;
  }

  // Lambda defining the scope: -> { }, lambda { }, proc { }
  protected get callable(): BlockNode | LambdaNode | null {
    const definition = positionalArguments(this.call)[1];
    if (isNode<LambdaNode>(definition, "LambdaNode")) { return definition; }
    if (isNode<CallNode>(definition, "CallNode") && !definition.receiver &&
      ["lambda", "proc"].indexOf(definition.name) >= 0 && isNode<BlockNode>(definition.block, "BlockNode")) {
      return definition.block;
    }
    return null;
  }

  // Name of the scope
  protected override get methodName(): string {
    return literalName(positionalArguments(this.call)[0]);
  }

  // Scope is a class method
  protected get directiveName(): string {
    return "self." + this.methodName;
  }

  // Scope returns a relation
  protected override returnTypesPlaceholder(): string {
    return "ActiveRecord::Relation";
  }
}
