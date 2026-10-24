"use strict";
import type { BlockParameterNode, DefNode, HashNode, KeywordRestParameterNode, Node }
  from "@ruby/prism" with { "resolution-mode": "import" };
import type { ParseError } from "@ruby/prism/src/deserialize.js" with { "resolution-mode": "import" };
import { isNode, nodeType } from "../../ast/prism";
import { DescriptionTag } from "../../tags/description";
import { OptionTag } from "../../tags/option";
import { ParamTag } from "../../tags/param";
import { ReturnTag } from "../../tags/return";
import { YieldTag } from "../../tags/yield";
import { YieldParamTag } from "../../tags/yield_param";
import { YieldReturnTag } from "../../tags/yield_return";
import { IEntity, IParseContext } from "../../types";
import { BlockUsage } from "../block_usage";
import { OptionsUsage } from "../options_usage";
import { RaiseUsage } from "../raise_usage";
import { IBaseParser } from "./base_parser";

// Parse a class or an instance method definition into documentation entities
export default class MethodDef implements IBaseParser {
  // Types placeholders of splat and block params
  private readonly typesPlaceholders: { [type: string]: string } = {
    BlockParameterNode: "Proc",
    KeywordRestParameterNode: "Hash{Symbol => Object}",
    RestParameterNode: "Array<Object>",
  };
  // Params which can't be documented: arguments forwarding and anonymous splat and block params,
  // YARD doesn't list them in a method signature
  private readonly anonymousTypes = ["BlockParameterNode", "KeywordRestParameterNode", "RestParameterNode"];

  // Existing method documentation is synced with the method
  public readonly supportsUpdate = true;

  constructor(private node: Node, private errors: ParseError[] = []) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode(this.node, "DefNode");
  }

  // Parse documentation tree
  public parse(context: IParseContext = {}): IEntity[] {
    return [
      this.buildDescription(),
      ...this.buildParams(context),
      this.buildYield(context),
      this.buildReturn(),
    ].filter((element): element is IEntity => element !== undefined);
  }

  // Is method signature malformed: params parentheses aren't closed or there's a syntax error within the signature.
  // Params recovered from a malformed signature are a guess, errors in a method body don't matter.
  public isMalformed(): boolean {
    const def = this.def;
    if (def.lparenLoc && !def.rparenLoc) { return true; }
    const end = def.rparenLoc ? def.rparenLoc.endOffset() :
      def.parameters ? def.parameters.location.endOffset() : def.nameLoc.endOffset();
    return this.errors.some((error) =>
      error.location.startOffset >= def.location.startOffset && error.location.startOffset <= end);
  }

  // Classes of exceptions raised in the method body
  public raises(): string[] {
    return (new RaiseUsage(this.def.body)).detect();
  }

  // Method definition node
  private get def(): DefNode {
    return this.node as DefNode;
  }

  // Build description section
  private buildDescription(): IEntity {
    return new DescriptionTag();
  }

  // Build params section, block param is documented with a yield section if blocks are documented
  private buildParams(context: IParseContext): IEntity[] {
    return this.params()
      .filter((param) => !(context.blocks && isNode(param, "BlockParameterNode")))
      .filter((param) => this.isDocumentable(param))
      .map((param) => {
        const name = this.paramName(param);
        const value: Node | null = "value" in param ? param.value as Node : null;
        const typesPlaceholder = this.typesPlaceholders[nodeType(param)] || "";
        return new ParamTag({ name, options: this.buildOptions(param, value), typesPlaceholder });
      });
  }

  // Can param be documented with @param tag
  private isDocumentable(param: Node): boolean {
    const type = nodeType(param);
    if (type === "ForwardingParameterNode") { return false; }
    return this.anonymousTypes.indexOf(type) < 0 || !!("name" in param && param.name);
  }

  // Build yield section if method accepts a block
  private buildYield(context: IParseContext): IEntity | undefined {
    if (!context.blocks) { return; }
    const blockParam = this.params().find((param) => isNode(param, "BlockParameterNode")) as BlockParameterNode;
    const blockName = blockParam ? blockParam.name || undefined : undefined;
    const usage = (new BlockUsage(this.def.body, blockParam !== undefined, blockName)).detect();
    if (!usage.usesBlock) { return; }
    const yieldParams = usage.params.map((name, index) =>
      new YieldParamTag({ name, nameLink: name ? "" : "yieldparam" + index }));
    return new YieldTag({ yieldParams, yieldReturn: new YieldReturnTag() });
  }

  // Build return section
  private buildReturn(): IEntity | undefined {
    if (this.def.name === "initialize") { return; }
    return new ReturnTag();
  }

  // Build options of an options hash: a param with a hash default value or a keyword splat.
  // Placeholders are seeded for an empty hash default if no keys are found.
  private buildOptions(param: Node, value: Node | null): OptionTag[] {
    const isHash = isNode<HashNode>(value, "HashNode");
    const isKeywordRest = isNode<KeywordRestParameterNode>(param, "KeywordRestParameterNode") && !!param.name;
    if (!isHash && !isKeywordRest) { return []; }
    const paramName = String((param as KeywordRestParameterNode).name);
    const options = (new OptionsUsage(paramName, value, this.def.body)).detect()
      .map(({ key, defaultValue }) => new OptionTag({ paramName, key, defaultValue }));
    if (options.length === 0 && isHash && value.elements.length === 0) {
      return this.seedOptions(paramName);
    }
    return options;
  }

  // Build placeholders of options hash keys
  private seedOptions(paramName: string, count: number = 3): OptionTag[] {
    return Array.from({ length: count }, () => new OptionTag({ paramName }));
  }

  // List method params in order of appearance
  private params(): Node[] {
    const params = this.def.parameters;
    if (!params) { return []; }
    return [
      ...params.requireds, ...params.optionals, params.rest, ...params.posts,
      ...params.keywords, params.keywordRest, params.block,
    ]
      .filter((param): param is Node => !!param && nodeType(param) !== "NoKeywordsParameterNode")
      .sort((a, b) => a.location.startOffset - b.location.startOffset);
  }

  // Param name as it's documented, splat and block params are named without sigils the same way YARD names them
  private paramName(param: Node): string {
    const type = nodeType(param);
    if (type === "MultiTargetNode") {
      return param.location.slice();
    }
    return "name" in param && param.name ? String(param.name) : "";
  }
}
