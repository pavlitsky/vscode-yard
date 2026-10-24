"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { PrivateTag } from "../tags/private";
import { IParseContext } from "../types";

// RDoc's directive hiding a definition, it trails the first line of the definition: 'def foo # :nodoc:'
const NODOC_PATTERN = /^#\s*:nodoc:/;

// Private tag of a definition hidden from RDoc with ':nodoc:', YARD doesn't read the directive.
// Empty if the definition isn't hidden.
export function nodocTags(node: Node, context: IParseContext): PrivateTag[] {
  const comment = context.trailingComment ? context.trailingComment(node.location.startLine()) : undefined;
  return comment && NODOC_PATTERN.test(comment) ? [new PrivateTag()] : [];
}
