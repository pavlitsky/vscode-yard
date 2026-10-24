"use strict";
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
  // Regexp to extract method's name, its scope and params
  // See https://docs.ruby-lang.org/en/trunk/syntax/methods_rdoc.html#label-Method+Names
  // tslint:disable:max-line-length
  public readonly regExp = new RegExp([
      /(?:def)\s+/, // def
      /(?:self)?\.?/, // self.
      /([a-zA-Z_\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf][a-zA-Z_0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+[!?=]?|\+|-|\*|\*\*|\/|%|&|\^|>>|<<|==|!=|===|=~|!~|<=>|<|<=|>|>=|\[\]=|\[\]|\+@|-@|!@|~@)?/, // method name
      /(\(.*\)|[^;].*)?/, // method parameters
    ].map((r) => r.source).join(""),
  );
  // tslint:enable:max-line-length

  // Method body is used to document a block
  public readonly requiresBody = true;
  // Method definition line
  private text: string;
  // Method name
  private parsedName: string = "";
  // Method params string with parenthesis
  private parsedParams: string = "";

  constructor(text: string) {
    this.text = text;
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, name, params] = match;
      this.parsedName = name;
      this.parsedParams = params;
    }
  }

  // Is this parser ready to process the text
  public isApplicable(): boolean {
    return this.parsedName !== "";
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

  // Build description section
  private buildDescription(): IEntity {
    return new DescriptionTag();
  }

  // Build params section, block param is documented with a yield section if blocks are documented
  private buildParams(context: IParseContext): IEntity[] {
    let params = this.splitParams();
    if (context.body) { params = params.filter((param) => !param.startsWith("&")); }
    return params.map((param) => {
      const [, name, defaultValue] = /^([^=:]*)[:=]?(.*)$/.exec(param);
      let options: OptionTag[] = [];
      if (defaultValue === "{}") { options = this.seedOptions(name); }
      return new ParamTag({ name, defaultValue, options });
    });
  }

  // Build yield section if method accepts a block
  private buildYield(context: IParseContext): IEntity {
    if (!context.body) { return; }
    const blockParam = this.splitParams().find((param) => param.startsWith("&"));
    const blockName = blockParam ? blockParam.slice(1) || undefined : undefined;
    const lines = [this.text].concat(context.body);
    const usage = (new BlockUsage(lines, blockParam !== undefined, blockName)).detect();
    if (!usage.usesBlock) { return; }
    const yieldParams = usage.params.map((name, index) =>
      new YieldParamTag({ name, nameLink: name ? "" : "yieldparam" + index }));
    return new YieldTag({ yieldParams, yieldReturn: new YieldReturnTag() });
  }

  // Split method params string into a list of params
  private splitParams(): string[] {
    if (!this.parsedParams) { return []; }
    const clearedParams: string = this.parsedParams.replace(/\(|\)|\s/g, "");
    if (clearedParams === "") { return []; }
    return clearedParams.split(",");
  }

  // Build return section
  private buildReturn(): IEntity {
    if (this.parsedName === "initialize") { return; }
    return new ReturnTag();
  }

  // Build options hash section
  private seedOptions(paramName: string, count: number = 3): OptionTag[] {
    const options: OptionTag[] = [];
    Array.from(Array(count), () =>
    options.push(new OptionTag({ paramName, defaultValue: undefined })));
    return options;
  }
}
