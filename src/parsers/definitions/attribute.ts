"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse an attribute definition into documentation entities
export default class Attribute implements IBaseParser {
  // Names of attribute definition methods
  public readonly regExp = /^(?:(?:attr|mattr|cattr)_(?:reader|writer|accessor)|class_attribute)$/;

  constructor(private node: Node) {}

  // Is this parser ready to process the node: attr_reader :foo, class_attribute :foo etc.
  public isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode")) { return false; }
    const args = this.node.arguments_ ? this.node.arguments_.arguments_ : [];
    return !this.node.receiver && this.regExp.test(this.node.name) && isNode(args[0] || null, "SymbolNode");
  }

  // Parse documentation tree
  public parse(): IEntity[] {
    return [new ReturnTag()];
  }
}
