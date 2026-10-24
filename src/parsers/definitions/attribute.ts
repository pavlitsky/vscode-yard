"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { Directive } from "../../entities/directive";
import { DescriptionTag } from "../../tags/description";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { literalName, positionalArguments } from "../call_arguments";
import { isSig, SorbetSignature } from "../signatures/sorbet";
import { IBaseParser, IDefinitionSite } from "./base_parser";

// Parse an attribute definition into documentation entities.
// Class attributes defined by Rails aren't seen by YARD, they're documented with @!attribute directives.
export default class Attribute implements IBaseParser {
  // Names of attribute definition methods
  public readonly regExp = /^(?:(?:attr|mattr|cattr)_(?:reader|writer|accessor)|class_attribute)$/;
  // Names of class attribute definition methods
  private readonly classRegExp = /^(?:mattr|cattr)_|^class_attribute$/;
  // Access of attributes by a kind of a definition method
  private readonly access: { [kind: string]: string } = { accessor: "rw", reader: "r", writer: "w" };

  constructor(private node: Node, private site: IDefinitionSite = {}) {}

  // Is this parser ready to process the node: attr_reader :foo, class_attribute :foo etc.
  public isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode")) { return false; }
    const args = this.node.arguments_ ? this.node.arguments_.arguments_ : [];
    return !this.node.receiver && this.regExp.test(this.node.name) && isNode(args[0] || null, "SymbolNode");
  }

  // Parse documentation tree, attribute type is taken from Sorbet sig.
  // Each class attribute is documented with a directive: @!attribute [rw] self.name
  public parse(): IEntity[] {
    if (this.classRegExp.test((this.node as CallNode).name)) { return this.directives(); }
    return [new ReturnTag({ types: this.types() })];
  }

  // Directive for each attribute: @!attribute [rw] name, class attributes are named with 'self.'
  public directives(): Directive[] {
    const name = (this.node as CallNode).name;
    const access = this.access[/_(reader|writer|accessor)$/.exec(name)?.[1] ?? "accessor"];
    const prefix = this.classRegExp.test(name) ? "self." : "";
    return positionalArguments(this.node as CallNode)
      .filter((arg) => isNode(arg, "SymbolNode"))
      .map((arg) => new Directive({
        directiveName: "attribute",
        entities: [new DescriptionTag(), new ReturnTag({ types: this.types() })],
        signature: "[" + access + "] " + prefix + literalName(arg),
      }));
  }

  // Attribute types declared by Sorbet sig: its return type or a type of a writer's param, empty if it's unknown
  private types(): string {
    const previous = this.site.previous;
    const signature = isSig(previous) ? (new SorbetSignature(previous)).parse() : undefined;
    const types = signature?.returns === "void" ? undefined : signature?.returns;
    return types ?? (signature ? Object.values(signature.params)[0] : undefined) ?? "";
  }

  // Documentation of an attribute with Sorbet sig is placed above the sig
  public documentationLine(): number | undefined {
    const previous = this.site.previous;
    return isSig(previous) ? previous.location.startLine() : undefined;
  }
}
