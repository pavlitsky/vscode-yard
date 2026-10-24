"use strict";
import type { BlockNode, BlockParametersNode, CallNode, LambdaNode, Node, ParametersNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { Directive } from "../../entities/directive";
import { IEntity, IParseContext } from "../../types";
import MethodDef from "./method";

// Method defined by a call with a block or a lambda: define_method(:name) { |a| }, scope :name, ->(a) {}.
// YARD doesn't see such methods, they're documented with @!method directive.
export abstract class DirectiveMethod extends MethodDef {
  // Directives aren't updated
  public override readonly supportsUpdate: boolean = false;

  // Parse documentation of the method nested in a directive: @!method name(params)
  public override parse(context: IParseContext = {}): IEntity[] {
    const params = this.parameters ? "(" + this.parameters.location.slice().replace(/\s*\n\s*/g, " ") + ")" : "";
    return [new Directive({ directiveName: "method", entities: super.parse(context), signature: this.directiveName + params })];
  }

  // Block params aren't checked for syntax errors
  public override isMalformed(): boolean {
    return false;
  }

  // Documentation is placed above the call
  public override documentationLine(): number | undefined {
    return undefined;
  }

  // Call defining the method
  protected get call(): CallNode {
    return this.node as CallNode;
  }

  // Block or lambda defining the method, null if the method is defined otherwise
  protected abstract get callable(): BlockNode | LambdaNode | null;

  // Method name as it's written in the directive, class methods are prefixed with 'self.'
  protected abstract get directiveName(): string;

  // Methods named with 'self.' are class methods
  protected override get isClassMethod(): boolean {
    return this.directiveName.startsWith("self.");
  }

  // Params of the block or the lambda
  protected override get parameters(): ParametersNode | null {
    const params = this.callable ? this.callable.parameters : null;
    return isNode<BlockParametersNode>(params, "BlockParametersNode") ? params.parameters : null;
  }

  // Body of the block or the lambda
  protected override get body(): Node | null {
    return this.callable ? this.callable.body : null;
  }
}
