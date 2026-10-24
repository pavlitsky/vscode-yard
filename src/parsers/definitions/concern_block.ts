"use strict";
import type { BlockNode, CallNode, DefNode, Node, StatementsNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseError } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { Directive } from "../../entities/directive";
import { IEntity, IParseContext } from "../../types";
import association from "./association";
import Attribute from "./attribute";
import { IBaseParser, IDefinitionSite } from "./base_parser";
import defineMethod from "./define_method";
import delegation from "./delegation";
import MethodDef from "./method";
import scope from "./scope";

// Parsers of definitions within a block documented with directives
const directiveParsers = [Attribute, defineMethod, delegation, scope, association];

// Definition within a block with its parser
interface IBlockDefinition {
  parser: IBaseParser;
  statement: Node;
}

// Block of ActiveSupport::Concern evaluated by a class including the concern:
// included do ... end, prepended do ... end, class_methods do ... end.
// YARD doesn't look into blocks, so definitions within the block are documented with directives above the block:
// a @!method directive for each method, methods of class_methods block are class methods.
// Attributes and definitions documented with directives on their own, like scope or has_many, get directives too.
export default class ConcernBlock implements IBaseParser {
  // Methods taking a block evaluated by an including class, methods of class_methods block are class methods
  private readonly blocks: { [name: string]: boolean } = { class_methods: true, included: false, prepended: false };

  // Directives aren't updated
  public readonly supportsUpdate: boolean = false;

  constructor(private node: Node, private site: IDefinitionSite = {}) {}

  // Is this parser ready to process the node: a block call without arguments having documentable definitions
  public isApplicable(): boolean {
    if (!isNode<CallNode>(this.node, "CallNode") || this.node.receiver || this.node.arguments_) { return false; }
    if (this.blocks[this.node.name] === undefined || !isNode(this.node.block, "BlockNode")) { return false; }
    return this.definitions().length > 0;
  }

  // Is any method signature within the block malformed
  public isMalformed(): boolean {
    return this.definitions().some(({ parser }) => !!parser.isMalformed && parser.isMalformed());
  }

  // Parse documentation tree: directives of definitions in order of appearance
  public parse(context: IParseContext = {}): IEntity[] {
    const blockContext = { ...context, comments: [], overloads: false };
    return this.definitions().flatMap(({ parser, statement }) => {
      if (isNode<DefNode>(statement, "DefNode")) { return [this.methodDirective(statement, parser.parse(blockContext))]; }
      if (parser instanceof Attribute) { return parser.directives(); }
      return parser.parse(blockContext).filter((entity) => entity.type === "Directive");
    });
  }

  // Wrap method documentation into a directive: @!method name(params)
  private methodDirective(def: DefNode, entities: IEntity[]): Directive {
    const isClassMethod = this.blocks[(this.node as CallNode).name] || !!def.receiver;
    const params = def.parameters ? "(" + def.parameters.location.slice().replace(/\s*\n\s*/g, " ") + ")" : "";
    const signature = (isClassMethod ? "self." : "") + def.name + params;
    return new Directive({ directiveName: "method", entities, signature });
  }

  // Definitions within the block with their parsers: method definitions and definitions documented with directives.
  // Methods following bare private or protected aren't documented.
  private definitions(): IBlockDefinition[] {
    const body = ((this.node as CallNode).block as BlockNode).body;
    if (!isNode<StatementsNode>(body, "StatementsNode")) { return []; }
    const errors: ParseError[] = this.site.errors ?? [];
    let isPublic = true;
    return body.body.flatMap((statement, index): IBlockDefinition[] => {
      const site = { errors, previous: body.body[index - 1] ?? null };
      if (isNode<CallNode>(statement, "CallNode") && !statement.receiver && !statement.arguments_ &&
        ["private", "protected", "public"].indexOf(statement.name) >= 0) {
        isPublic = statement.name === "public";
        return [];
      }
      if (!isPublic) { return []; }
      if (isNode(statement, "DefNode")) { return [{ parser: new MethodDef(statement, site), statement }]; }
      const parser = directiveParsers.map((Parser) => new Parser(statement, site)).find((p) => p.isApplicable());
      if (!parser) { return []; }
      if (!(parser instanceof Attribute) && !parser.parse().some((entity) => entity.type === "Directive")) { return []; }
      return [{ parser, statement }];
    });
  }
}
