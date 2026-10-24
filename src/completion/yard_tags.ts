"use strict";

// Standard YARD tag offered for completion
export interface IYardTag {
  name: string;
  // Snippet text after the tag name, a function of params style for tags with a name and types
  snippet: string | ((paramNameBeforeType: boolean) => string);
  documentation: string;
}

// Snippet of a tag with a name and types in a specified style
const nameAndTypes = (paramNameBeforeType: boolean) => paramNameBeforeType ?
  " ${1:<name>} [${2:<Type>}] ${3:<description>}" : " [${1:<Type>}] ${2:<name>} ${3:<description>}";

// Standard YARD tags, see https://rubydoc.info/gems/yard/file/docs/Tags.md
export const yardTags: IYardTag[] = [
  { name: "abstract", snippet: " ${1:<description>}", documentation: "Marks a class or a method as abstract." },
  { name: "api", snippet: " ${1|public,private|}", documentation: "Declares the API the object belongs to." },
  { name: "author", snippet: " ${1:<Name>} <${2:<email>}>", documentation: "Lists the author of a class or a module." },
  { name: "deprecated", snippet: " ${1:<description>}", documentation: "Marks a method or a class as deprecated." },
  { name: "example", snippet: " ${1:<title>}\n#   ${2:<code>}", documentation: "Shows an example of code." },
  { name: "note", snippet: " ${1:<description>}", documentation: "Adds an emphasized note." },
  {
    documentation: "Describes a key of an options hash param.",
    name: "option",
    snippet: " ${1:<name>} [${2:<Type>}] :${3:<key>} ${4:<description>}",
  },
  { name: "overload", snippet: " ${1:<signature>}", documentation: "Describes an alternative method signature." },
  { name: "param", snippet: nameAndTypes, documentation: "Describes a method param." },
  { name: "private", snippet: "", documentation: "Marks an object as private." },
  { name: "raise", snippet: " [${1:<Exception>}] ${2:<description>}", documentation: "Describes a raised exception." },
  { name: "return", snippet: " [${1:<Type>}] ${2:<description>}", documentation: "Describes a return value." },
  { name: "see", snippet: " ${1:<reference>}", documentation: "Refers to an object, a URL or other resource." },
  { name: "since", snippet: " ${1:<version>}", documentation: "Lists a version the object was added in." },
  { name: "todo", snippet: " ${1:<description>}", documentation: "Marks a TODO note." },
  { name: "version", snippet: " ${1:<version>}", documentation: "Lists a version of the object." },
  { name: "yield", snippet: " [${1:<names>}] ${2:<description>}", documentation: "Describes values passed to a block." },
  { name: "yieldparam", snippet: nameAndTypes, documentation: "Describes a value passed to a block." },
  { name: "yieldreturn", snippet: " [${1:<Type>}] ${2:<description>}", documentation: "Describes a block return value." },
];
