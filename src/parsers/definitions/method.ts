"use strict";
import type { BlockParameterNode, DefNode, HashNode, KeywordRestParameterNode, Node }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType } from "../../ast/prism";
import { AbstractTag } from "../../tags/abstract";
import { DeprecatedTag } from "../../tags/deprecated";
import { DescriptionTag } from "../../tags/description";
import { OptionTag } from "../../tags/option";
import { ParamTag } from "../../tags/param";
import { RaiseTag } from "../../tags/raise";
import { ReturnTag } from "../../tags/return";
import { YieldTag } from "../../tags/yield";
import { YieldParamTag } from "../../tags/yield_param";
import { YieldReturnTag } from "../../tags/yield_return";
import { IEntity, IParseContext } from "../../types";
import { BlockUsage } from "../block_usage";
import { DeprecationUsage } from "../deprecation_usage";
import { defaultTypes } from "../literal_types";
import { OptionsUsage } from "../options_usage";
import { RaiseUsage } from "../raise_usage";
import { ReturnUsage } from "../return_usage";
import { methodSignature } from "../signatures/method_signature";
import { genericType, ISignature } from "../signatures/signature";
import { isSig } from "../signatures/sorbet";
import { IBaseParser, IDefinitionSite } from "./base_parser";

// Parse a class or an instance method definition into documentation entities
export default class MethodDef implements IBaseParser {
  // Types placeholders of splat and block params
  private readonly typesPlaceholders: { [type: string]: string } = {
    BlockParameterNode: "Proc",
    KeywordRestParameterNode: "Hash{Symbol => Object}",
    RestParameterNode: "Array<Object>",
  };
  // Return types placeholders of conventional methods: conversions, comparisons and collection sizes.
  // Predicate methods ending with '?' return Boolean.
  private readonly returnTypesPlaceholders: { [name: string]: string } = {
    "!": "Boolean",
    "!=": "Boolean",
    "<": "Boolean",
    "<=": "Boolean",
    "<=>": "Integer, nil",
    "==": "Boolean",
    "===": "Boolean",
    "=~": "Integer, nil",
    ">": "Boolean",
    ">=": "Boolean",
    count: "Integer",
    hash: "Integer",
    inspect: "String",
    length: "Integer",
    size: "Integer",
    to_a: "Array",
    to_ary: "Array",
    to_f: "Float",
    to_h: "Hash",
    to_hash: "Hash",
    to_i: "Integer",
    to_int: "Integer",
    to_json: "String",
    to_proc: "Proc",
    to_s: "String",
    to_str: "String",
    to_sym: "Symbol",
  };
  // Params which can't be documented: arguments forwarding and anonymous splat and block params,
  // YARD doesn't list them in a method signature
  private readonly anonymousTypes = ["BlockParameterNode", "KeywordRestParameterNode", "RestParameterNode"];

  // Existing method documentation is synced with the method
  public readonly supportsUpdate = true;

  constructor(private node: Node, private site: IDefinitionSite = {}) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode(this.node, "DefNode");
  }

  // Parse documentation tree. Types are taken from a Sorbet or an rbs-inline signature if there's one.
  public parse(context: IParseContext = {}): IEntity[] {
    const signature = methodSignature(this.def, this.site.previous ?? null, context.comments || []);
    return [
      this.buildDescription(),
      this.buildAbstract(signature),
      this.buildDeprecated(),
      ...this.buildParams(context, signature),
      this.buildYield(context, signature),
      ...this.buildRaises(context),
      this.buildReturn(signature),
    ].filter((element): element is IEntity => element !== undefined);
  }

  // Documentation of a method with Sorbet sig is placed above the sig
  public documentationLine(): number | undefined {
    const previous = this.site.previous;
    return isSig(previous) ? previous.location.startLine() : undefined;
  }

  // Is method signature malformed: params parentheses aren't closed or there's a syntax error within the signature.
  // Params recovered from a malformed signature are a guess, errors in a method body don't matter.
  public isMalformed(): boolean {
    const def = this.def;
    if (def.lparenLoc && !def.rparenLoc) { return true; }
    const end = def.rparenLoc ? def.rparenLoc.endOffset() :
      def.parameters ? def.parameters.location.endOffset() : def.nameLoc.endOffset();
    return (this.site.errors ?? []).some((error) =>
      error.location.startOffset >= def.location.startOffset && error.location.startOffset <= end);
  }

  // Classes of exceptions raised in the method body, NotImplementedError of an abstract method isn't listed
  public raises(): string[] {
    const usage = new RaiseUsage(this.def.body);
    return usage.isAbstract() ? [] : usage.detect();
  }

  // Method definition node
  private get def(): DefNode {
    return this.node as DefNode;
  }

  // Build description section
  private buildDescription(): IEntity {
    return new DescriptionTag();
  }

  // Build abstract tag if the method only raises NotImplementedError or it's declared abstract by its signature
  private buildAbstract(signature?: ISignature): IEntity | undefined {
    if (!signature?.abstract && !(new RaiseUsage(this.def.body)).isAbstract()) { return; }
    return new AbstractTag();
  }

  // Build deprecated tag if the method warns about its deprecation
  private buildDeprecated(): IEntity | undefined {
    if (!(new DeprecationUsage(this.def.body)).detect()) { return; }
    return new DeprecatedTag();
  }

  // Build params section, block param is documented with a yield section if blocks are documented
  private buildParams(context: IParseContext, signature?: ISignature): IEntity[] {
    return this.params()
      .filter((param) => !(context.blocks && isNode(param, "BlockParameterNode")))
      .filter((param) => this.isDocumentable(param))
      .map((param) => {
        const name = this.paramName(param);
        const value: Node | null = "value" in param ? param.value as Node : null;
        const typesPlaceholder = this.typesPlaceholders[nodeType(param)] || (value ? defaultTypes([value]) : "");
        const types = signature ? this.signatureTypes(param, signature.params[name]) : "";
        return new ParamTag({ name, options: this.buildOptions(param, value), types, typesPlaceholder });
      });
  }

  // Types of a param declared by a signature, splat params are declared with types of their elements
  private signatureTypes(param: Node, types: string | undefined): string {
    if (!types) { return ""; }
    if (isNode(param, "RestParameterNode")) { return genericType("Array", [types]) ?? ""; }
    if (isNode(param, "KeywordRestParameterNode")) { return genericType("Hash", ["Symbol", types]) ?? ""; }
    return types;
  }

  // Can param be documented with @param tag
  private isDocumentable(param: Node): boolean {
    const type = nodeType(param);
    if (type === "ForwardingParameterNode") { return false; }
    return this.anonymousTypes.indexOf(type) < 0 || !!("name" in param && param.name);
  }

  // Build yield section if method accepts a block
  private buildYield(context: IParseContext, signature?: ISignature): IEntity | undefined {
    if (!context.blocks) { return; }
    const blockParam = this.params().find((param) => isNode(param, "BlockParameterNode")) as BlockParameterNode;
    const blockName = blockParam ? blockParam.name || undefined : undefined;
    const usage = (new BlockUsage(this.def.body, blockParam !== undefined, blockName)).detect();
    if (!usage.usesBlock) { return; }
    const block = signature?.block;
    const yieldParams = usage.params.map((name, index) => new YieldParamTag({
      name, nameLink: name ? "" : "yieldparam" + index, types: block?.params[index] ?? "",
    }));
    return new YieldTag({ yieldParams, yieldReturn: new YieldReturnTag({ types: block?.returns ?? "" }) });
  }

  // Build raise section of exceptions raised in the method body if documenting of exceptions is enabled
  private buildRaises(context: IParseContext): IEntity[] {
    if (!context.raises) { return []; }
    return this.raises().map((exception) => new RaiseTag({ types: exception }));
  }

  // Build return section
  private buildReturn(signature?: ISignature): IEntity | undefined {
    if (this.def.name === "initialize") { return; }
    const typesPlaceholder = (new ReturnUsage(this.def.body)).detect() || this.returnTypesPlaceholder();
    return new ReturnTag({ types: signature?.returns ?? "", typesPlaceholder });
  }

  // Return types placeholder of a conventional method, empty if return type is unknown
  private returnTypesPlaceholder(): string {
    const name = this.def.name;
    if (Object.prototype.hasOwnProperty.call(this.returnTypesPlaceholders, name)) {
      return this.returnTypesPlaceholders[name];
    }
    return name.endsWith("?") ? "Boolean" : "";
  }

  // Build options of an options hash: a param with a hash default value or a keyword splat.
  // Placeholders are seeded for an empty hash default if no keys are found.
  private buildOptions(param: Node, value: Node | null): OptionTag[] {
    const isHash = isNode<HashNode>(value, "HashNode");
    const isKeywordRest = isNode<KeywordRestParameterNode>(param, "KeywordRestParameterNode") && !!param.name;
    if (!isHash && !isKeywordRest) { return []; }
    const paramName = String((param as KeywordRestParameterNode).name);
    const options = (new OptionsUsage(paramName, value, this.def.body)).detect()
      .map(({ key, defaultValue, types }) => new OptionTag({ paramName, key, defaultValue, typesPlaceholder: types }));
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
