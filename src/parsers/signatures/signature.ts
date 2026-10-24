"use strict";

// Types of a block or a proc, YARD types lists. Unknown types are undefined.
export interface IProcTypes {
  // Types of block params by position
  params: (string | undefined)[];
  returns?: string;
}

// Types of a method declared by its signature, YARD types lists. Unknown types are undefined.
export interface ISignature {
  // Types of params by names they're documented with, without sigils
  params: { [name: string]: string | undefined };
  // Types of a block passed to the method
  block?: IProcTypes;
  returns?: string;
  // Is method declared abstract
  abstract?: boolean;
}

// Join types into a YARD types list, nil goes last: "String, nil". Undefined if any type is unknown.
export function joinTypes(types: (string | undefined)[] | undefined): string | undefined {
  if (!types || types.length === 0 || types.some((type) => type === undefined)) { return; }
  const list = (types as string[]).flatMap((type) => type.split(/,\s*(?![^<{(]*[>})])/));
  const unique = list.filter((type, index) => list.indexOf(type) === index);
  return unique.filter((type) => type !== "nil").concat(unique.indexOf("nil") >= 0 ? ["nil"] : []).join(", ");
}

// YARD type of a generic: Array<String>, Hash{Symbol => Integer}, Set<Integer>
export function genericType(name: string, args: (string | undefined)[]): string | undefined {
  if (args.some((arg) => arg === undefined)) { return; }
  if (name === "Hash" && args.length === 2) { return "Hash{" + args[0] + " => " + args[1] + "}"; }
  return name + "<" + args.join(", ") + ">";
}
