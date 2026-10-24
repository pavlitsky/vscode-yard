"use strict";
import type { BlockNode, CallNode, LambdaNode } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { literalName, positionalArguments } from "../call_arguments";
import { DirectiveMethod } from "./directive_method";

// Method defined with define_method(:name) { |a| } or define_singleton_method(:name, ->(a) {})
export default class DefineMethod extends DirectiveMethod {
  // Methods defining instance and singleton methods
  private readonly definers = ["define_method", "define_singleton_method"];

  // Is this parser ready to process the node
  public override isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode") || this.node.receiver) { return false; }
    return this.definers.indexOf(this.node.name) >= 0 && !!this.methodName;
  }

  // Block or lambda defining the method
  protected get callable(): BlockNode | LambdaNode | null {
    if (isNode<BlockNode>(this.call.block, "BlockNode")) { return this.call.block; }
    const definition = positionalArguments(this.call)[1];
    return isNode<LambdaNode>(definition, "LambdaNode") ? definition : null;
  }

  // Name of the defined method
  protected override get methodName(): string {
    return literalName(positionalArguments(this.call)[0]);
  }

  // Singleton methods are prefixed with 'self.'
  protected get directiveName(): string {
    return (this.call.name === "define_singleton_method" ? "self." : "") + this.methodName;
  }
}
