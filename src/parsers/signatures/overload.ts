"use strict";
import type { Node, ParametersNode } from "@ruby/prism" with { "resolution-mode": "import" };
import { paramName } from "./method_signature";
import { IRbsMethodType } from "./rbs";

// Param of an overload: a param of RBS method type matched with a param of the method definition
export interface IOverloadParam {
  kind: "required" | "optional" | "rest" | "keyword" | "keywordRest" | "block";
  // Name of the param, empty if it's unknown
  name: string;
  // Matching param of the method definition
  node?: Node;
  // Declared types, splat params are declared with types of their elements
  types?: string;
  // Is a keyword or a block optional
  optional?: boolean;
}

// Match params of an overload with params of the method definition. Positional params are matched by position:
// leading ones with required and optional params, trailing ones with post params, others go to a splat param.
// Keywords are matched by name. Params without a match are named the way RBS names them.
export function overloadParams(params: ParametersNode | null, methodType: IRbsMethodType): IOverloadParam[] {
  const leading = params ? [...params.requireds, ...params.optionals] : [];
  const posts = params ? params.posts : [];
  const positionals = methodType.positionals;
  const trailing = positionals.length - posts.length >= 0 &&
    positionals.slice(positionals.length - posts.length).every((param) => param.kind === "required") ?
    posts.length : 0;

  const result: IOverloadParam[] = positionals.map((param, index) => {
    const isTrailing = index >= positionals.length - trailing;
    const node = param.kind === "rest" ? params?.rest ?? undefined :
      isTrailing ? posts[index - (positionals.length - trailing)] : leading[index];
    return { kind: param.kind, name: node ? paramName(node) : param.name ?? "", node, types: param.types };
  });

  Object.keys(methodType.keywords).forEach((name) => {
    const node = params?.keywords.find((keyword) => paramName(keyword) === name);
    const optional = (methodType.optionalKeywords ?? []).indexOf(name) >= 0;
    result.push({ kind: "keyword", name, node, optional, types: methodType.keywords[name] });
  });
  if (methodType.keywordRest) {
    const node = params?.keywordRest ?? undefined;
    const name = node ? paramName(node) : methodType.keywordRest.name ?? "";
    result.push({ kind: "keywordRest", name, node, types: methodType.keywordRest.types });
  }
  if (methodType.block && params?.block) {
    result.push({ kind: "block", name: paramName(params.block), node: params.block, optional: methodType.block.optional });
  }
  return result;
}

