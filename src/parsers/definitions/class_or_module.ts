"use strict";
import type { ClassNode, Node } from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode } from "../../ast/prism";
import { AuthorTag } from "../../tags/author";
import { DescriptionTag } from "../../tags/description";
import { IParseContext } from "../../types";
import { IBaseParser } from "./base_parser";
import { structMembers } from "./struct";

// Parse class or module definition into documentation entities
export default class ClassOrModule implements IBaseParser {
  // Author info is used to fill the @author tag
  public readonly requiresAuthor = true;

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    return isNode(this.node, "ClassNode") || isNode(this.node, "ModuleNode");
  }

  // Parse documentation tree, members of a Struct superclass are documented the way YARD reads them:
  // class Point < Struct.new(:x, :y)
  public parse(context: IParseContext = {}) {
    const { name = "", email = "" } = context.author || {};
    const superclass = isNode<ClassNode>(this.node, "ClassNode") ? this.node.superclass : null;
    const members = (structMembers(superclass) ?? []).filter((member) => member.tagName === "attr");
    return [
      new DescriptionTag(),
      ...members,
      new AuthorTag({ authorName: name, authorEmail: email }),
    ];
  }
}
