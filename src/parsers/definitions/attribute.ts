"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { isSig, SorbetSignature } from "../signatures/sorbet";
import { IBaseParser, IDefinitionSite } from "./base_parser";

// Parse an attribute definition into documentation entities
export default class Attribute implements IBaseParser {
  // Names of attribute definition methods
  public readonly regExp = /^(?:(?:attr|mattr|cattr)_(?:reader|writer|accessor)|class_attribute)$/;

  constructor(private node: Node, private site: IDefinitionSite = {}) {}

  // Is this parser ready to process the node: attr_reader :foo, class_attribute :foo etc.
  public isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode")) { return false; }
    const args = this.node.arguments_ ? this.node.arguments_.arguments_ : [];
    return !this.node.receiver && this.regExp.test(this.node.name) && isNode(args[0] || null, "SymbolNode");
  }

  // Parse documentation tree, attribute type is taken from Sorbet sig: its return type or a type of a writer's param
  public parse(): IEntity[] {
    const previous = this.site.previous;
    const signature = isSig(previous) ? (new SorbetSignature(previous)).parse() : undefined;
    let types = signature?.returns === "void" ? undefined : signature?.returns;
    if (!types && signature) { types = Object.values(signature.params)[0]; }
    return [new ReturnTag({ types: types ?? "" })];
  }

  // Documentation of an attribute with Sorbet sig is placed above the sig
  public documentationLine(): number | undefined {
    const previous = this.site.previous;
    return isSig(previous) ? previous.location.startLine() : undefined;
  }
}
