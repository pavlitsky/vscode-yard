"use strict";
import type { Node, ParametersNode } from "@ruby/prism" with { "resolution-mode": "import" };
import { nodeType } from "../../ast/prism";
import { IRbsMethodType, RbsParser } from "./rbs";
import { ISignature, joinTypes } from "./signature";
import { isSig, SorbetSignature } from "./sorbet";

// rbs-inline method type annotation: '#: (Integer) -> String'
const ANNOTATION_PATTERN = /^#:\s?(.*)$/;
// rbs-inline method type written with @rbs: '# @rbs (Integer) -> String'
const RBS_METHOD_PATTERN = /^#\s*@rbs\s+((?:\[|\(|\?\{|\{|->).*)$/;
// Overload of a method type written with @rbs on a next line: '#   | (String) -> Integer'
const RBS_OVERLOAD_PATTERN = /^#\s+\|\s*(.*)$/;
// rbs-inline param annotation with an optional description: '# @rbs name: String -- description'
const RBS_PARAM_PATTERN = /^#\s*@rbs\s+(return|[*&]{0,2}[a-z_]\w*)\s*:\s*(.*?)(?:\s+--(?:\s.*)?)?$/;

// Number of trailing rbs-inline annotation lines of comments, they're written right above a definition
export function annotationLinesCount(comments: string[]): number {
  let count = 0;
  while (count < comments.length && ANNOTATION_PATTERN.test(comments[comments.length - 1 - count])) { count++; }
  return count;
}

// Signature of a method: Sorbet sig preceding the method, or rbs-inline annotations in comments above it.
// Types of splat params are types of their elements.
export function methodSignature(params: ParametersNode | null, previous: Node | null, comments: string[]):
  ISignature | undefined {
  if (isSig(previous)) { return (new SorbetSignature(previous)).parse(); }
  const signature = rbsMethodSignature(params, comments);
  return rbsParamsSignature(comments, signature);
}

// Method types of rbs-inline overloads preceding a method without Sorbet sig.
// Undefined if the method isn't overloaded or any of its overloads is malformed.
export function rbsOverloads(previous: Node | null, comments: string[]): IRbsMethodType[] | undefined {
  if (isSig(previous)) { return; }
  const methodTypes = rbsMethodTypes(comments);
  if (methodTypes.length < 2) { return; }
  const overloads = methodTypes.map((methodType) => (new RbsParser(methodType)).methodType());
  return overloads.some((overload) => !overload) ? undefined : overloads as IRbsMethodType[];
}

// Method types of rbs-inline annotations: '#:' lines right above a definition,
// method types written with @rbs and their overloads on next lines
function rbsMethodTypes(comments: string[]): string[] {
  const annotations = comments.slice(comments.length - annotationLinesCount(comments));
  const methodTypes = annotations.map((line) => (ANNOTATION_PATTERN.exec(line) as RegExpExecArray)[1]);
  let isOverloaded = false;
  comments.forEach((line) => {
    const match = RBS_METHOD_PATTERN.exec(line) ?? (isOverloaded ? RBS_OVERLOAD_PATTERN.exec(line) : null);
    if (match) { methodTypes.push(match[1]); }
    isOverloaded = !!match;
  });
  return methodTypes;
}

// Signature of a single rbs-inline method type annotation, overloads aren't read
function rbsMethodSignature(params: ParametersNode | null, comments: string[]): ISignature | undefined {
  const methodTypes = rbsMethodTypes(comments);
  if (methodTypes.length !== 1) { return; }
  const methodType = (new RbsParser(methodTypes[0])).methodType();
  if (!methodType) { return; }

  const signature: ISignature = { params: {}, returns: methodType.returns };
  if (params) {
    // Leading required positionals are requireds, trailing ones after optionals or splat are posts
    const firstOther = methodType.positionals.findIndex((param) => param.kind !== "required");
    const leading = firstOther < 0 ? methodType.positionals : methodType.positionals.slice(0, firstOther);
    const others = firstOther < 0 ? [] : methodType.positionals.slice(firstOther);
    const optionals = others.filter((param) => param.kind === "optional");
    const rest = others.find((param) => param.kind === "rest");
    const posts = others.filter((param, index) => param.kind === "required" &&
      others.slice(0, index).some((other) => other.kind !== "required"));
    const assign = (nodes: Node[], types: { types?: string }[]) =>
      nodes.forEach((node, index) => { signature.params[paramName(node)] = types[index]?.types; });
    assign(params.requireds, leading);
    assign(params.optionals, optionals);
    assign(params.posts, posts);
    if (params.rest && rest) { assign([params.rest], [rest]); }
    params.keywords.forEach((node) => { signature.params[paramName(node)] = methodType.keywords[paramName(node)]; });
    if (params.keywordRest && methodType.keywordRest) { assign([params.keywordRest], [methodType.keywordRest]); }
    if (params.block && methodType.block) {
      signature.params[paramName(params.block)] = methodType.block.optional ? "Proc, nil" : "Proc";
    }
  }
  if (methodType.block) { signature.block = methodType.block.types; }
  return signature;
}

// Signature extended with rbs-inline param annotations: '# @rbs name: String', '# @rbs return: void'
function rbsParamsSignature(comments: string[], signature: ISignature | undefined): ISignature | undefined {
  let result = signature;
  comments.forEach((line) => {
    const match = RBS_PARAM_PATTERN.exec(line);
    if (!match) { return; }
    const type = (new RbsParser(match[2])).annotationType();
    if (!type) { return; }
    result ??= { params: {} };
    const name = match[1].replace(/^[*&]+/, "");
    if (match[1] === "return") {
      result.returns = type.types;
    } else if (match[1].startsWith("&")) {
      result.params[name] = joinTypes(["Proc"].concat(type.optional ? ["nil"] : []));
      if (type.proc) { result.block = type.proc; }
    } else {
      result.params[name] = type.optional ? joinTypes([type.types, "nil"]) : type.types;
    }
  });
  return result;
}

// Param name as it's documented, without sigils
export function paramName(param: Node): string {
  if (nodeType(param) === "MultiTargetNode") { return param.location.slice(); }
  return "name" in param && param.name ? String(param.name) : "";
}
