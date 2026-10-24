"use strict";
import { IDocItem } from "./parser";

// Param name without splat and block sigils
export function bareName(name: string): string {
  return name.replace(/^(?:\*\*|\*|&)/, "");
}

// Do param names match ignoring splat and block sigils
export function sameName(name: string | undefined, other: string | undefined): boolean {
  return !!name && !!other && bareName(name) === bareName(other);
}

// Params style of a docstring: is name written before types, undefined if it's unknown
export function paramNameBeforeType(items: IDocItem[]): boolean | undefined {
  const item = items.find((i) => i.nameFirst !== undefined);
  return item ? item.nameFirst : undefined;
}
