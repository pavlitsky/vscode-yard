"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { Directive } from "../../entities/directive";
import { DescriptionTag } from "../../tags/description";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";
import { keywordArguments, literalName, positionalArguments } from "../call_arguments";

// Delegated methods documented with @!method directives since YARD doesn't see them:
// delegate :name, :email, to: :user, prefix: true (Rails), def_delegators :@user, :name, :email (Forwardable)
export default class Delegation implements IBaseParser {
  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode<CallNode>(this.node, "CallNode") && !this.node.receiver && this.names().length > 0;
  }

  // Parse documentation tree, a directive for each delegated method
  public parse(): IEntity[] {
    return this.names().map((name) => new Directive({
      directiveName: "method", entities: [new DescriptionTag(), new ReturnTag()], signature: name,
    }));
  }

  // Names of delegated methods
  private names(): string[] {
    const call = this.node as CallNode;
    const args = positionalArguments(call).map((arg) => literalName(arg));
    switch (call.name) {
      case "delegate": return args.filter((name) => name).map((name) => this.prefix() + name);
      case "def_delegators": case "def_instance_delegators": return args.slice(1).filter((name) => name);
      case "def_delegator": case "def_instance_delegator": return [args[2] || args[1]].filter((name) => name);
      default: return [];
    }
  }

  // Prefix of Rails delegated methods: prefix: true prefixes them with a target name, prefix: :name with the name
  private prefix(): string {
    const options = keywordArguments(this.node as CallNode);
    const prefix = options.prefix;
    if (!prefix) { return ""; }
    if (isNode(prefix, "TrueNode")) {
      const target = literalName(options.to).replace(/^@+/, "");
      return target ? target + "_" : "";
    }
    const name = literalName(prefix);
    return name ? name + "_" : "";
  }
}
