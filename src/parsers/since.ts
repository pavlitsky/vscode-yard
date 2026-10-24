"use strict";
import { SinceTag } from "../tags/since";
import { IParseContext } from "../types";

// Tag of a version a new definition is added in if it's enabled, the version is a placeholder to type over
export function sinceTags(context: IParseContext): SinceTag[] {
  if (!context.since) { return []; }
  return [new SinceTag(context.version ? { textPlaceholder: context.version } : {})];
}
