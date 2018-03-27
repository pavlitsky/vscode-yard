"use strict";
import { SnippetBuilder } from "../snippet_builder";
import { IDocumenter } from "./documenter";

// Single method param helper
interface IParam {
  name: string;
  defaultValue: string;
}

// Document instance and class methods
export default class Method implements IDocumenter {
  // Regexp to extract method's name, its scope and params
  public readonly regExp = /(def)\s+(self)?\.?(\w+)?(\(.*\))?/;
  // Method name
  private parsedName: string = "";
  // Method params string with parenthesis
  private parsedParams: string = "";
  private sb: SnippetBuilder;

  constructor(text) {
    const match: RegExpExecArray = this.regExp.exec(text);
    if (match) {
      const [, , scope, name, params] = match;
      this.parsedName = name;
      this.parsedParams = params;
    }
  }

  // Is this documenter active for supplied text
  public isApplicable(): boolean {
    return this.parsedName !== "";
  }

  // Build documentation snippet
  public buildSnippet(eol: string) {
    this.sb = new SnippetBuilder(eol);
    this.buildDescription();
    this.buildParams();
    this.buildReturn();
    return this.sb.build();
  }

  // Build description section
  private buildDescription() {
    this.sb.spacer();
    this.sb.description();
    this.sb.spacer();
  }

  // Build params section
  private buildParams() {
    const params = this.params(this.parsedParams);
    if (params.length === 0) { return; }

    params.forEach((param) => {
      this.sb.param(param.name, param.defaultValue);
      if (param.defaultValue === "{}") { this.buildOptionsHash(param.name); }
    });
    this.sb.spacer();
  }

  // Build return section
  private buildReturn() {
    if (this.parsedName === "initialize") { return; }
    this.sb.return();
    this.sb.spacer();
  }

  // Build options hash section
  private buildOptionsHash(name: string, count: number = 3) {
    Array.from(Array(count), (_, i) =>
      this.sb.option(name));
  }

  // Fetch parameters array from parsed string
  private params(paramsString): IParam[] {
    if (!paramsString) { return []; }
    const clearedParams: string = paramsString.replace(/\(|\)|\s/g, "");
    if (clearedParams === "") { return []; }
    return clearedParams.split(",").map((param) => {
      const [, name, defaultValue] = /^([^=:]*)[:=]?(.*)$/.exec(param);
      return { name, defaultValue };
    });
  }
}
