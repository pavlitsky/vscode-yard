"use strict";
import type { BlockParameterNode, DefNode, HashNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
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
import { IBaseParser } from "./base_parser";

// Parse a class or an instance method definition into documentation entities
export default class MethodDef implements IBaseParser {
  // Prefixes of splat and block param names
  private readonly sigils: { [type: string]: string } = {
    BlockParameterNode: "&",
    KeywordRestParameterNode: "**",
    RestParameterNode: "*",
  };

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode(this.node, "DefNode");
  }

  // Parse documentation tree
  public parse(context: IParseContext = {}): IEntity[] {
    return []
      .concat(this.buildDescription())
      .concat(this.buildParams(context))
      .concat(this.buildYield(context))
      .concat(this.buildReturn())
      .filter((element) => element !== undefined);
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
      .map((param) => {
        const name = this.paramName(param);
        const value: Node = "value" in param ? param.value as Node : null;
        const defaultValue = value ? value.location.slice() : "";
        let options: OptionTag[] = [];
        if (isNode<HashNode>(value, "HashNode") && value.elements.length === 0) {
          options = this.seedOptions(name);
        }
        return new ParamTag({ name, defaultValue, options });
      });
  }

  // Build yield section if method accepts a block
  private buildYield(context: IParseContext): IEntity {
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
  private buildReturn(): IEntity {
    if (this.def.name === "initialize") { return; }
    return new ReturnTag();
  }

  // Build options hash section
  private seedOptions(paramName: string, count: number = 3): OptionTag[] {
    const options: OptionTag[] = [];
    Array.from(Array(count), () =>
    options.push(new OptionTag({ paramName, defaultValue: undefined })));
    return options;
  }

  // List method params in order of appearance
  private params(): Node[] {
    const params = this.def.parameters;
    if (!params) { return []; }
    return [].concat(
      params.requireds, params.optionals, params.rest, params.posts,
      params.keywords, params.keywordRest, params.block,
    )
      .filter((param: Node) => param && !isNode(param, "NoKeywordsParameterNode"))
      .sort((a: Node, b: Node) => a.location.startOffset - b.location.startOffset);
  }

  // Param name as it's documented: splat and block params keep their sigils, '...' for arguments forwarding
  private paramName(param: Node): string {
    const type = nodeType(param);
    if (type === "ForwardingParameterNode" || type === "MultiTargetNode") {
      return param.location.slice();
    }
    const name = "name" in param && param.name ? String(param.name) : "";
    return (this.sigils[type] || "") + name;
  }
}
