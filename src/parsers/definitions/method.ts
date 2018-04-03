"use strict";
import { DescriptionTag } from "../../tags/description";
import { OptionTag } from "../../tags/option";
import { ParamTag } from "../../tags/param";
import { ReturnTag } from "../../tags/return";
import { IEntity } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse a class or an instance method definition into documentation entities
export default class MethodDef implements IBaseParser {
  // Regexp to extract method's name, its scope and params
  // See https://docs.ruby-lang.org/en/trunk/syntax/methods_rdoc.html#label-Method+Names
  // tslint:disable:max-line-length
  public regExp = new RegExp([
      /(def)\s+/ // def
    , /(self)?\.?/ // self.
    , /([a-zA-Z_\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf][a-zA-Z_0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+[!?=]?|\+|-|\*|\*\*|\/|%|&|\^|>>|<<|==|!=|===|=~|!~|<=>|<|<=|>|>=|\[\]=|\[\]|\+@|-@|!@|~@)?/ // method name
    , /(\(.*\))?/, // method parameters
    ].map((r) => r.source).join(""),
    );
  // tslint:enable:max-line-length

  // Method name
  private parsedName: string = "";
  // Method params string with parenthesis
  private parsedParams: string = "";

  constructor(text) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, , , name, params] = match;
      this.parsedName = name;
      this.parsedParams = params;
    }
  }

  // Is this parser ready to process the text
  public isApplicable(): boolean {
    return this.parsedName !== "";
  }

  // Parse documentation tree
  public parse(): IEntity[] {
    return []
      .concat(this.buildDescription())
      .concat(this.buildParams())
      .concat(this.buildReturn())
      .filter((element) => element !== undefined);
  }

  // Build description section
  private buildDescription(): IEntity {
    return new DescriptionTag();
  }

  // Build params section
  private buildParams(): IEntity[] {
    if (!this.parsedParams) { return []; }
    const clearedParams: string = this.parsedParams.replace(/\(|\)|\s/g, "");
    if (clearedParams === "") { return []; }
    return clearedParams.split(",").map((param) => {
      const [, name, defaultValue] = /^([^=:]*)[:=]?(.*)$/.exec(param);
      let options: OptionTag[] = [];
      if (defaultValue === "{}") { options = this.seedOptions(name); }
      return new ParamTag({ name, defaultValue, options });
    });
  }

  // Build return section
  private buildReturn(): IEntity {
    if (this.parsedName === "initialize") { return; }
    return new ReturnTag();
  }

  // Build options hash section
  private seedOptions(paramName: string, count: number = 3): OptionTag[] {
    const options: OptionTag[] = [];
    Array.from(Array(count), (_, i) =>
    options.push(new OptionTag({ paramName, defaultValue: undefined })));
    return options;
  }
}
