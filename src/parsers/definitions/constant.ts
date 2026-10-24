"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse a constant definition into documentation entities
export default class Constant implements IBaseParser {
  // Nodes of constant assignment: FOO = 1, Foo::BAR = 1, FOO ||= 1
  private readonly types = ["ConstantWriteNode", "ConstantPathWriteNode", "ConstantOrWriteNode"];

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return this.types.some((type) => isNode(this.node, type));
  }

  // Parse documentation tree
  public parse(): IEntity[] {
    return [new ReturnTag()];
  }
}
