"use strict";
import type { CallNode, ConstantPathWriteNode, ConstantWriteNode, Node }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType } from "../../ast/prism";
import { TagWithTypes } from "../../entities/tag_with_types";
import { AuthorTag } from "../../tags/author";
import { DescriptionTag } from "../../tags/description";
import { IEntity, IParseContext } from "../../types";
import { literalName, positionalArguments } from "../call_arguments";
import { nodocTags } from "../nodoc";
import { sinceTags } from "../since";
import { IBaseParser } from "./base_parser";

// Members of a Struct.new or a Data.define call with tags YARD reads their types from:
// @attr tags of Struct members and @attr_reader tags of Data members, undefined for other nodes
export function structMembers(node: Node | null | undefined): TagWithTypes[] | undefined {
  if (!isNode<CallNode>(node, "CallNode") || !node.receiver) { return; }
  const receiver = node.receiver.location.slice().replace(/^::/, "");
  const isStruct = receiver === "Struct" && node.name === "new";
  const isData = receiver === "Data" && node.name === "define";
  if (!isStruct && !isData) { return; }
  // Struct class name given by a string isn't a member
  return positionalArguments(node)
    .filter((arg) => isNode(arg, "SymbolNode"))
    .map((arg) => new TagWithTypes({ name: literalName(arg), tagName: isStruct ? "attr" : "attr_reader" }));
}

// Parse a Struct or a Data class assigned to a constant into documentation entities:
// Point = Struct.new(:x, :y), Point = Data.define(:x, :y). YARD documents them as classes with their members.
export default class StructDef implements IBaseParser {
  // Author info is used to fill the @author tag
  public readonly requiresAuthor = true;

  constructor(private node: Node) {}

  // Is this parser ready to process the node
  public isApplicable(): boolean {
    if (["ConstantWriteNode", "ConstantPathWriteNode"].indexOf(nodeType(this.node)) < 0) { return false; }
    return structMembers((this.node as ConstantWriteNode | ConstantPathWriteNode).value) !== undefined;
  }

  // Parse documentation tree, Struct or Data class hidden from RDoc with ':nodoc:' is private
  public parse(context: IParseContext = {}): IEntity[] {
    const { name = "", email = "" } = context.author || {};
    return [
      new DescriptionTag(),
      ...structMembers((this.node as ConstantWriteNode | ConstantPathWriteNode).value) ?? [],
      ...nodocTags(this.node, context),
      new AuthorTag({ authorName: name, authorEmail: email }),
      ...sinceTags(context),
    ];
  }
}
