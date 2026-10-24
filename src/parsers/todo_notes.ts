"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { TodoTag } from "../tags/todo";
import { IParseContext } from "../types";

// Comment with a TODO note: '# TODO: retry on timeout', '# FIXME handle nil'
const NOTE_PATTERN = /^#\s*(?:TODO|FIXME|XXX|HACK|OPTIMIZE)\b:?\s*(.*?)\s*$/;

// Tags of TODO notes written in comments within a definition if documenting of TODO notes is enabled
export function todoTags(node: Node, context: IParseContext): TodoTag[] {
  if (!context.todos || !context.commentsWithin) { return []; }
  return context.commentsWithin(node.location.startLine(), node.location.endLine()).flatMap((comment) => {
    const match = NOTE_PATTERN.exec(comment);
    return match ? [new TodoTag({ text: match[1] })] : [];
  });
}
