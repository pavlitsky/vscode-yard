"use strict";
import type { Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { AuthorTag } from "../../tags/author";
import { DescriptionTag } from "../../tags/description";
import { IParseContext } from "../../types";
import { IBaseParser } from "./base_parser";

// Parse class or module definition into documentation entities
export default class ClassOrModule implements IBaseParser {
  // Author info is used to fill the @author tag
  public readonly requiresAuthor = true;

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode(this.node, "ClassNode") || isNode(this.node, "ModuleNode");
  }

  // Parse documentation tree
  public parse(context: IParseContext = {}) {
    const { name = "", email = "" } = context.author || {};
    return [
      new DescriptionTag(),
      new AuthorTag({ authorName: name, authorEmail: email }),
    ];
  }
}
