"use strict";
import type { CallNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { Directive } from "../../entities/directive";
import { DescriptionTag } from "../../tags/description";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";
import { keywordArguments, literalName, positionalArguments } from "../call_arguments";

// Irregular plurals of association names
const IRREGULAR_PLURALS: { [plural: string]: string } = {
  children: "child", men: "man", people: "person", women: "woman",
};
// Rules making a singular out of a plural, the first matching rule applies
const SINGULAR_RULES: [RegExp, string][] = [
  [/(movie)s$/, "$1"], [/ies$/, "y"], [/(ss|us|x|z|ch|sh)es$/, "$1"], [/([^s])s$/, "$1"],
];

// Rails associations documented with @!attribute directives since YARD doesn't see them:
// has_many :posts, has_one :profile, belongs_to :author, has_and_belongs_to_many :tags
export default class Association implements IBaseParser {
  // Associations by macros: is it a collection
  private readonly macros: { [name: string]: boolean } = {
    belongs_to: false, has_and_belongs_to_many: true, has_many: true, has_one: false,
  };

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode") || this.node.receiver) { return false; }
    return this.macros[this.node.name] !== undefined && !!this.name();
  }

  // Parse documentation tree, the association type is guessed from its name or class_name option
  public parse(): IEntity[] {
    return [new Directive({
      directiveName: "attribute",
      entities: [new DescriptionTag(), new ReturnTag({ typesPlaceholder: this.types() })],
      signature: "[rw] " + this.name(),
    })];
  }

  // Name of the association
  private name(): string {
    return literalName(positionalArguments(this.node as CallNode)[0]);
  }

  // Types of the association: a collection proxy of records or a record, empty for polymorphic associations
  private types(): string {
    const call = this.node as CallNode;
    const options = keywordArguments(this.node as CallNode);
    if (options.polymorphic && isNode(options.polymorphic, "TrueNode")) { return ""; }
    const isCollection = this.macros[call.name];
    const className = literalName(options.class_name).replace(/^::/, "") || this.classify(this.name(), isCollection);
    if (isCollection) { return "ActiveRecord::Associations::CollectionProxy<" + className + ">"; }
    const isOptional = call.name === "has_one" || (!!options.optional && isNode(options.optional, "TrueNode"));
    return className + (isOptional ? ", nil" : "");
  }

  // Class name of an association name: blog_posts is BlogPost
  private classify(name: string, isPlural: boolean): string {
    const singular = isPlural ? this.singularize(name) : name;
    return singular.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  }

  // Singular of an English plural: categories is category
  private singularize(plural: string): string {
    const [, prefix, last] = /^(.*?)([^_]*)$/.exec(plural) as RegExpExecArray;
    if (IRREGULAR_PLURALS[last]) { return prefix + IRREGULAR_PLURALS[last]; }
    const rule = SINGULAR_RULES.find(([pattern]) => pattern.test(last));
    return prefix + (rule ? last.replace(rule[0], rule[1]) : last);
  }
}
