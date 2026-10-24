"use strict";
import { TagOption } from "../entities/tag_option";
import { TagWithOptions } from "../entities/tag_with_options";
import { TagWithTypes } from "../entities/tag_with_types";
import { Yield } from "../entities/yield";
import { IEntity } from "../types";
import { sameName } from "./names";
import { IDocItem } from "./parser";

// Generated documentation entities missing in a docstring
export interface IDocGaps {
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

// Find generated documentation entities a docstring is missing
export function findGaps(items: IDocItem[], entities: IEntity[]): IDocGaps {
  const tagged = (tag: string) => items.filter((item) => item.tag === tag);
  const params = entities.filter((entity) => entity.type === "TagWithOptions") as TagWithOptions[];
  const isDocumented = (param: TagWithOptions) => tagged("param").some((item) => sameName(item.name, param.name));
  const gaps: IDocGaps = {
    options: params.filter(isDocumented).flatMap((param) => param.options.filter((option) =>
      option.key && !tagged("option").some((item) => sameName(item.name, param.name) && item.key === option.key))),
    params: params.filter((param) => !isDocumented(param)),
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
