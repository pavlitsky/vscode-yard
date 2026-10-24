"use strict";
import { Overload } from "../entities/overload";
import { Tag } from "../entities/tag";
import { TagOption } from "../entities/tag_option";
import { TagWithOptions } from "../entities/tag_with_options";
import { TagWithTypes } from "../entities/tag_with_types";
import { Yield } from "../entities/yield";
import { IEntity } from "../types";
import { sameName } from "./names";
import { IDocItem } from "./parser";

// Generated documentation entities missing in a docstring
export interface IDocGaps {
  // Undocumented abstract method
  abstractTag?: Tag;
  // Undocumented deprecated method
  deprecatedTag?: Tag;
  // Undocumented private object hidden with ':nodoc:'
  privateTag?: Tag;
  // Undocumented params with their options
  params: TagWithOptions[];
  // Undocumented options of documented params
  options: TagOption[];
  // Whole yield section if nothing of it is documented
  yieldSection?: Yield;
  // Undocumented named block params of a documented yield section
  yieldParams: TagWithTypes[];
  // Undocumented block return value of a documented yield section
  yieldReturn?: TagWithTypes;
  // Undocumented return value
  returnTag?: TagWithTypes;
  // Overloads of a method documented without @overload tags
  overloads: Overload[];
  // Undocumented reference to an overridden method
  seeTag?: Tag;
  // Undocumented TODO notes
  todos: Tag[];
}

// Tags documenting a method signature without overloads
const signatureTags = ["option", "param", "return", "yield", "yieldparam", "yieldreturn"];

// Can a method be documented with overloads: docstring has @overload tags or it doesn't document the method signature.
// Docstring documenting params or return value without overloads is kept that way.
export function isOverloadable(items: IDocItem[]): boolean {
  const tags = items.map((item) => item.tag);
  return tags.indexOf("overload") >= 0 || !tags.some((tag) => signatureTags.indexOf(tag) >= 0);
}

// Generated tags of TODO notes
export function generatedTodos(entities: IEntity[]): Tag[] {
  return entities.filter((entity) => entity.type === "Tag" && (entity as Tag).tagName === "todo") as Tag[];
}

// Is a text documented with a tag of the same name and text: @todo, @see
export function isTextDocumented(items: IDocItem[], tagName: string, text: string): boolean {
  return items.some((item) => item.tag === tagName && item.lines[0].replace(/^@\S+\s*/, "").trim() === text);
}

// Generated overloads
export function generatedOverloads(entities: IEntity[]): Overload[] {
  return entities.filter((entity) => entity.type === "Overload") as Overload[];
}

// Generated tag of a text only or without a text: @abstract, @deprecated, @private
export function generatedTextTag(entities: IEntity[], tagName: string): Tag | undefined {
  return entities.find((entity) => entity.type === "Tag" && (entity as Tag).tagName === tagName) as Tag | undefined;
}

// Generated yield section
export function generatedYield(entities: IEntity[]): Yield | undefined {
  return entities.find((entity) => entity.type === "Yield") as Yield | undefined;
}

// Generated return value tag
export function generatedReturn(entities: IEntity[]): TagWithTypes | undefined {
  return entities.find((entity) =>
    entity.type === "TagWithTypes" && (entity as TagWithTypes).tagName === "return") as TagWithTypes | undefined;
}

// Generated tags of raised exceptions
export function generatedRaises(entities: IEntity[]): TagWithTypes[] {
  return entities.filter((entity) =>
    entity.type === "TagWithTypes" && (entity as TagWithTypes).tagName === "raise") as TagWithTypes[];
}

// Find generated documentation entities a docstring is missing
export function findGaps(items: IDocItem[], entities: IEntity[]): IDocGaps {
  const tagged = (tag: string) => items.filter((item) => item.tag === tag);
  const params = entities.filter((entity) => entity.type === "TagWithOptions") as TagWithOptions[];
  const isDocumented = (param: TagWithOptions) => tagged("param").some((item) => sameName(item.name, param.name));
  const gaps: IDocGaps = {
    options: params.filter(isDocumented).flatMap((param) => param.options.filter((option) =>
      option.key && !tagged("option").some((item) => sameName(item.name, param.name) && item.key === option.key))),
    overloads: tagged("overload").length === 0 ? generatedOverloads(entities) : [],
    params: params.filter((param) => !isDocumented(param)),
    todos: generatedTodos(entities).filter((todo) => !isTextDocumented(items, "todo", todo.text)),
    yieldParams: [],
  };

  const yieldSection = generatedYield(entities);
  if (yieldSection) {
    const yieldItems = items.filter((item) => ["yield", "yieldparam", "yieldreturn"].indexOf(item.tag) >= 0);
    if (yieldItems.length === 0) {
      gaps.yieldSection = yieldSection;
    } else {
      gaps.yieldParams = yieldSection.yieldParams.filter((param) =>
        param.name && !tagged("yieldparam").some((item) => item.name === param.name));
      if (tagged("yieldreturn").length === 0) { gaps.yieldReturn = yieldSection.yieldReturn; }
    }
  }

  const abstractTag = generatedTextTag(entities, "abstract");
  if (abstractTag && tagged("abstract").length === 0) { gaps.abstractTag = abstractTag; }
  const deprecatedTag = generatedTextTag(entities, "deprecated");
  if (deprecatedTag && tagged("deprecated").length === 0) { gaps.deprecatedTag = deprecatedTag; }
  const privateTag = generatedTextTag(entities, "private");
  if (privateTag && tagged("private").length === 0) { gaps.privateTag = privateTag; }

  const seeTag = generatedTextTag(entities, "see");
  if (seeTag && !isTextDocumented(items, "see", seeTag.text)) { gaps.seeTag = seeTag; }

  const returnTag = generatedReturn(entities);
  if (returnTag && tagged("return").length === 0) { gaps.returnTag = returnTag; }
  return gaps;
}

// Is an exception class documented with a @raise tag
export function isRaiseDocumented(items: IDocItem[], exception: string): boolean {
  return items.some((item) => {
    const match = item.tag === "raise" ? /\[([^\]]*)\]/.exec(item.lines[0]) : null;
    return !!match && match[1].split(",").map((type) => type.trim()).indexOf(exception) >= 0;
  });
}
