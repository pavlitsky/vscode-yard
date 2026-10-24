"use strict";
import { Raw } from "../entities/raw";
import { TagWithOptions } from "../entities/tag_with_options";
import { IEntity } from "../types";
import { generatedRaises, generatedReturn, generatedYield, isRaiseDocumented } from "./gaps";
import { bareName, paramNameBeforeType, sameName } from "./names";
import { IDocItem } from "./parser";

// Blank lines settings applied to inserted tags
export interface IMergeSpacers {
  beforeTags: boolean;
  separateTags: boolean;
}

// Order of tags: params with options, then yield section, then raised exceptions, then return value.
// Other tags aren't ranked.
const tagRanks: { [tag: string]: number } = {
  option: 1, param: 1, raise: 3, return: 4, yield: 2, yieldparam: 2, yieldreturn: 2,
};

// Part of a merged docstring: an existing item or a new entity
type ISegment = { item: IDocItem; entity?: undefined; rank?: number } |
  { item?: undefined; entity: IEntity; rank?: number };

// Merge an existing docstring with freshly generated documentation entities.
// Texts and tags are kept as they're written, missing tags are added and params are synced with the method signature:
// params are reordered, a stale param is renamed if a new param takes its place, otherwise it's removed.
export class DocstringMerger {
  // Is merged docstring different from the existing one
  public changed = false;
  // Does description end with a text line
  private descriptionEndsWithText = false;

  constructor(private items: IDocItem[], private entities: IEntity[], private spacers: IMergeSpacers) {}

  // Params style of the existing docstring: is name written before types, undefined if it's unknown
  public get paramNameBeforeType(): boolean | undefined {
    return paramNameBeforeType(this.items);
  }

  // Merge docstring into a list of entities to render
  public merge(): IEntity[] {
    const firstTag = this.items.findIndex((item) => item.tag !== "");
    let description = firstTag < 0 ? this.items : this.items.slice(0, firstTag);
    let tags = firstTag < 0 ? [] : this.items.slice(firstTag);
    if (tags.length === 0) {
      // Trailing blank lines stay after tags added to a description only docstring
      let end = description.length;
      while (end > 0 && this.isBlank(description[end - 1])) { end--; }
      tags = description.slice(end);
      description = description.slice(0, end);
    }
    this.descriptionEndsWithText = description.length > 0 && !this.isBlank(description[description.length - 1]);

    let segments = this.mergeParams(tags);
    segments = this.mergeYield(segments);
    segments = this.mergeRaises(segments);
    segments = this.mergeReturn(segments);

    const lines = description.flatMap((item) => item.lines);
    return [new Raw({ lines }) as IEntity].concat(segments.map((segment) =>
      segment.entity ? segment.entity : new Raw({ lines: segment.item.lines })));
  }

  // Sync params and their options with the method signature
  private mergeParams(tags: IDocItem[]): ISegment[] {
    const generated = this.entities.filter((entity) => entity.type === "TagWithOptions") as TagWithOptions[];
    const paramItems = tags.filter((item) => item.tag === "param");
    const optionItems = tags.filter((item) => item.tag === "option");
    const isDocumented = (item: IDocItem) => generated.some((param) => sameName(item.name, param.name));
    const used: IDocItem[] = [];
    const group: ISegment[] = [];

    generated.forEach((param, index) => {
      let item = paramItems.find((i) => sameName(i.name, param.name));
      const stale = paramItems[index];
      if (!item && stale && stale.name && !isDocumented(stale)) { item = stale; }
      // Names written with sigils are renamed too, YARD expects them without sigils
      const isRenamed = item && item.name !== param.name;
      const options = optionItems.filter((option) => sameName(option.name, item ? item.name : param.name));
      used.push(...(item ? [item] : []), ...options);

      if (item) {
        group.push({ item: isRenamed ? this.renamed(item, "param", param.name) : item, rank: 1 });
      } else {
        group.push({ entity: new TagWithOptions({ ...param, options: [] }), rank: 1 });
      }
      options.forEach((option) => group.push({
        item: isRenamed ? this.renamed(option, "option", bareName(param.name)) : option, rank: 1,
      }));
      const keys = options.map((option) => option.key);
      param.options
        .filter((option) => option.key ? keys.indexOf(option.key) < 0 : !item && options.length === 0)
        .forEach((option) => group.push({ entity: option, rank: 1 }));
      if (!item || isRenamed || group.some((segment) => segment.entity)) { this.changed = true; }
    });

    const existing = paramItems.concat(optionItems);
    if (existing.some((item) => used.indexOf(item) < 0)) { this.changed = true; }
    if (!this.sameOrder(tags.filter((item) => used.indexOf(item) >= 0), used)) { this.changed = true; }

    // Params group takes place of the first existing param or option
    const anchor = tags.findIndex((item) => item.tag === "param" || item.tag === "option");
    const segments: ISegment[] = tags
      .filter((item) => item.tag !== "param" && item.tag !== "option")
      .map((item) => ({ item, rank: tagRanks[item.tag] }));
    if (group.length === 0) { return segments; }
    if (anchor < 0) { return this.insertGroup(segments, group, 1); }
    const at = tags.slice(0, anchor).filter((item) => item.tag !== "param" && item.tag !== "option").length;
    segments.splice(at, 0, ...group);
    return segments;
  }

  // Add yield section or its missing parts: named block params and block return value
  private mergeYield(segments: ISegment[]): ISegment[] {
    const generated = generatedYield(this.entities);
    if (!generated) { return segments; }
    const isYieldTag = (segment: ISegment) => segment.rank === 2;
    if (!segments.some(isYieldTag)) { return this.insertGroup(segments, [{ entity: generated, rank: 2 }], 2); }

    const result = segments.slice();
    const documented = result.flatMap((s) => s.item?.tag === "yieldparam" ? [s.item.name] : []);
    const missing = generated.yieldParams
      .filter((param) => param.name && documented.indexOf(param.name) < 0)
      .map((param) => ({ entity: param, rank: 2 }));
    if (missing.length > 0) {
      const last = this.lastIndex(result, (s) => s.item?.tag === "yield" || s.item?.tag === "yieldparam");
      const at = last >= 0 ? last + 1 : result.findIndex((s) => s.item?.tag === "yieldreturn");
      result.splice(at, 0, ...missing);
      this.changed = true;
    }
    if (generated.yieldReturn && !result.some((s) => s.item?.tag === "yieldreturn")) {
      result.splice(this.lastIndex(result, isYieldTag) + 1, 0, { entity: generated.yieldReturn, rank: 2 });
      this.changed = true;
    }
    return result;
  }

  // Add tags of undocumented exceptions after documented ones, documented exceptions are kept even if they aren't raised
  private mergeRaises(segments: ISegment[]): ISegment[] {
    const missing = generatedRaises(this.entities)
      .filter((tag) => !isRaiseDocumented(this.items, tag.types))
      .map((entity) => ({ entity, rank: 3 }));
    if (missing.length === 0) { return segments; }
    const last = this.lastIndex(segments, (s) => s.item?.tag === "raise");
    if (last < 0) { return this.insertGroup(segments, missing, 3); }
    const result = segments.slice();
    result.splice(last + 1, 0, ...missing);
    this.changed = true;
    return result;
  }

  // Add return value tag if it's missing
  private mergeReturn(segments: ISegment[]): ISegment[] {
    const generated = generatedReturn(this.entities);
    if (!generated || segments.some((s) => s.item?.tag === "return")) { return segments; }
    return this.insertGroup(segments, [{ entity: generated, rank: 4 }], 4);
  }

  // Insert a new group of tags before tags ranked higher, or after the last tag ranked lower.
  // Group is separated from neighbour tags with blank lines according to spacers settings.
  private insertGroup(segments: ISegment[], group: ISegment[], rank: number): ISegment[] {
    let at = segments.findIndex((segment) => segment.rank !== undefined && segment.rank > rank);
    if (at < 0) { at = this.lastIndex(segments, (segment) => segment.rank !== undefined && segment.rank < rank) + 1; }
    const before = segments[at - 1];
    const after = segments[at];
    const blank = () => ({ item: { tag: "", lines: [""] } });
    const spaced = group.slice();
    const isSpacedBefore = before ?
      !this.isBlank(before.item) && this.spacers.separateTags : this.descriptionEndsWithText && this.spacers.beforeTags;
    if (isSpacedBefore) { spaced.unshift(blank()); }
    if (after && !this.isBlank(after.item) && this.spacers.separateTags) { spaced.push(blank()); }
    const result = segments.slice();
    result.splice(at, 0, ...spaced);
    this.changed = true;
    return result;
  }

  // Rename a param in a @param or @option tag line
  private renamed(item: IDocItem, tag: string, name: string): IDocItem {
    const escaped = (item.name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("^(@" + tag + "\\s+(?:\\[[^\\]]*\\]\\s*)?)" + escaped);
    const [first, ...rest] = item.lines;
    return { ...item, name, lines: [first.replace(pattern, "$1" + name), ...rest] };
  }

  // Is item a blank text line
  private isBlank(item: IDocItem | undefined): boolean {
    return !!item && item.tag === "" && item.lines.every((line) => line.trim() === "");
  }

  // Do lists have the same items in the same order
  private sameOrder(list: IDocItem[], other: IDocItem[]): boolean {
    return list.length === other.length && list.every((item, index) => item === other[index]);
  }

  // Index of the last element matching a predicate, -1 if nothing matches
  private lastIndex<T>(list: T[], predicate: (element: T) => boolean): number {
    for (let index = list.length - 1; index >= 0; index--) {
      if (predicate(list[index])) { return index; }
    }
    return -1;
  }
}
