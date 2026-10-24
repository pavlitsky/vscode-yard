"use strict";
import { genericType, IProcTypes, joinTypes } from "./signature";

// Token of an RBS type: a name, a literal or a punctuation
interface IToken {
  kind: "name" | "symbol" | "string" | "number" | "punct";
  value: string;
}

// Parsed RBS type: its types, unknown types are undefined. Proc types keep their params and return types.
interface IRbsType {
  types: (string | undefined)[];
  proc?: IProcTypes;
}

// Positional param of an RBS method type
export interface IRbsPositional {
  kind: "required" | "optional" | "rest";
  types?: string;
}

// Block of an RBS method type
export interface IRbsBlock {
  optional: boolean;
  types: IProcTypes;
}

// Parsed RBS method type: (Integer a, ?String b, *Symbol rest, key: String, **untyped opts) { (Integer) -> void } -> bool
export interface IRbsMethodType {
  positionals: IRbsPositional[];
  keywords: { [name: string]: string | undefined };
  keywordRest?: { types?: string };
  block?: IRbsBlock;
  returns?: string;
}

// Built-in RBS types standing for YARD types
const BUILTIN_TYPES: { [name: string]: string } = {
  bool: "Boolean", boolish: "Boolean", class: "Class", false: "Boolean", instance: "self", nil: "nil",
  self: "self", top: "Object", true: "Boolean", untyped: "Object", void: "void",
};

// Tokens: names with namespaces, symbols, punctuation, strings and integers
const TOKEN_PATTERN =
  /\s*(?:((?:::)?[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)|(:[A-Za-z_]\w*[?!=]?)|(->|\*\*|[()[\]{},|&?*^:<])|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(-?\d+))/y;

// Parse RBS method types and types into YARD types lists
export class RbsParser {
  private tokens: IToken[] = [];
  private position = 0;

  constructor(private source: string) {}

  // Parse a method type, undefined if it's malformed
  public methodType(): IRbsMethodType | undefined {
    return this.parsed(() => {
      this.skipTypeParams();
      const methodType = this.paramsList();
      if (this.peek("?") || this.peek("{")) { methodType.block = this.block(); }
      this.expect("->");
      methodType.returns = joinTypes(this.type().types);
      return methodType;
    });
  }

  // Parse a type of a param annotation, it's optional with a leading '?': ? ^(Integer) -> void.
  // Undefined if it's malformed. Proc types are parsed with their params and return types.
  public annotationType(): { types?: string; proc?: IProcTypes; optional: boolean } | undefined {
    return this.parsed(() => {
      const optional = this.accept("?");
      const type = this.type();
      return { optional, proc: type.proc, types: joinTypes(type.types) };
    });
  }

  // Tokenize source and run a parser, the whole source should be parsed
  private parsed<T>(parse: () => T): T | undefined {
    try {
      this.tokens = this.tokenize();
      this.position = 0;
      const result = parse.call(this);
      return this.position === this.tokens.length ? result : undefined;
    } catch {
      return;
    }
  }

  // Split source into tokens. A colon right after a name separates a keyword from its type.
  private tokenize(): IToken[] {
    const tokens: IToken[] = [];
    TOKEN_PATTERN.lastIndex = 0;
    while (TOKEN_PATTERN.lastIndex < this.source.length) {
      if (/^\s*$/.test(this.source.slice(TOKEN_PATTERN.lastIndex))) { break; }
      const start = TOKEN_PATTERN.lastIndex;
      const match = TOKEN_PATTERN.exec(this.source);
      if (!match) { throw new Error("Unexpected character"); }
      const [, name, symbol, punct, string, number] = match;
      const previous = tokens[tokens.length - 1];
      const afterName = previous && previous.kind === "name" && !/^\s/.test(this.source.slice(start));
      if (symbol && afterName) {
        // keyword: Type written without a space
        tokens.push({ kind: "punct", value: ":" });
        TOKEN_PATTERN.lastIndex = start + this.source.slice(start).indexOf(":") + 1;
      } else if (punct) {
        tokens.push({ kind: "punct", value: punct });
      } else if (name) {
        tokens.push({ kind: "name", value: name });
      } else if (symbol) {
        tokens.push({ kind: "symbol", value: symbol });
      } else if (string) {
        tokens.push({ kind: "string", value: string });
      } else if (number) {
        tokens.push({ kind: "number", value: number });
      }
    }
    return tokens;
  }

  // Skip type params of a generic method: [T, U < Comparable]
  private skipTypeParams() {
    if (this.peek("[")) { this.skipBalanced("[", "]"); }
  }

  // Parse params list of a method or a proc: (Integer a, ?String b, key: Symbol)
  private paramsList(): IRbsMethodType {
    const methodType: IRbsMethodType = { keywords: {}, positionals: [] };
    this.expect("(");
    while (!this.accept(")")) {
      if (methodType.positionals.length > 0 || Object.keys(methodType.keywords).length > 0 || methodType.keywordRest) {
        this.expect(",");
        if (this.accept(")")) { break; }
      }
      this.param(methodType);
    }
    return methodType;
  }

  // Parse a single param into a method type
  private param(methodType: IRbsMethodType) {
    const optional = this.accept("?");
    const token = this.tokens[this.position];
    const next = this.tokens[this.position + 1];
    if (token && token.kind === "name" && next && next.value === ":" && next.kind === "punct") {
      // Keyword: name: Type
      this.position += 2;
      methodType.keywords[token.value] = joinTypes(this.type().types);
      this.paramName();
      return;
    }
    if (!optional && this.accept("**")) {
      methodType.keywordRest = { types: joinTypes(this.type().types) };
      this.paramName();
      return;
    }
    const rest = !optional && this.accept("*");
    const kind = rest ? "rest" : optional ? "optional" : "required";
    methodType.positionals.push({ kind, types: joinTypes(this.type().types) });
    this.paramName();
  }

  // Skip an optional param name following its type: Integer count
  private paramName() {
    const token = this.tokens[this.position];
    if (token && token.kind === "name" && /^[a-z_]/.test(token.value) && !BUILTIN_TYPES[token.value]) {
      this.position++;
    }
  }

  // Parse a block: { (Integer) -> void } or an optional one ?{ ... }
  private block(): IRbsBlock {
    const optional = this.accept("?");
    this.expect("{");
    const params = this.peek("(") ? this.paramsList() : { keywords: {}, positionals: [] };
    // Self binding: [self: Foo]
    if (this.peek("[")) { this.skipBalanced("[", "]"); }
    this.expect("->");
    const returns = joinTypes(this.type().types);
    this.expect("}");
    return { optional, types: { params: params.positionals.map((param) => param.types), returns } };
  }

  // Parse a union: Integer | String
  private type(): IRbsType {
    const first = this.intersection();
    const types = first.types.slice();
    while (this.accept("|")) { types.push(...this.intersection().types); }
    return { proc: types.length === first.types.length ? first.proc : undefined, types };
  }

  // Parse an intersection, its types are unknown: _Each & _Countable
  private intersection(): IRbsType {
    const first = this.optional();
    if (!this.peek("&")) { return first; }
    while (this.accept("&")) { this.optional(); }
    return { types: [undefined] };
  }

  // Parse an optional type: String?
  private optional(): IRbsType {
    const type = this.primary();
    if (this.accept("?")) { return { proc: type.proc, types: type.types.concat("nil") }; }
    return type;
  }

  // Parse a primary type: a name, a generic, a literal, a tuple, a record or a proc
  private primary(): IRbsType {
    const token = this.tokens[this.position++];
    if (!token) { throw new Error("Unexpected end"); }
    if (token.kind === "symbol") { return { types: ["Symbol"] }; }
    if (token.kind === "string") { return { types: ["String"] }; }
    if (token.kind === "number") { return { types: ["Integer"] }; }
    if (token.value === "(") {
      const type = this.type();
      this.expect(")");
      return type;
    }
    if (token.value === "[") {
      const elements: (string | undefined)[] = [];
      while (!this.accept("]")) {
        if (elements.length > 0) { this.expect(","); }
        elements.push(joinTypes(this.type().types));
      }
      if (elements.length === 0) { return { types: ["Array"] }; }
      return { types: [elements.some((e) => e === undefined) ? undefined : "Array(" + elements.join(", ") + ")"] };
    }
    if (token.value === "{") {
      this.position--;
      this.skipBalanced("{", "}");
      return { types: ["Hash"] };
    }
    if (token.value === "^") { return this.proc(); }
    if (token.kind !== "name") { throw new Error("Unexpected token"); }
    if (token.value === "singleton" && this.accept("(")) {
      const type = this.type();
      this.expect(")");
      return { types: [genericType("Class", [joinTypes(type.types)])] };
    }
    const builtin = BUILTIN_TYPES[token.value];
    if (builtin) { return { types: [builtin] }; }
    const name = token.value.replace(/^::/, "");
    if (!this.peek("[")) { return { types: [/^[a-z]/.test(name) ? undefined : name] }; }
    this.expect("[");
    const args: (string | undefined)[] = [];
    while (!this.accept("]")) {
      if (args.length > 0) { this.expect(","); }
      args.push(joinTypes(this.type().types));
    }
    return { types: [/^[a-z]/.test(name) ? undefined : genericType(name, args)] };
  }

  // Parse a proc after '^': ^(Integer) { (String) -> void } -> bool
  private proc(): IRbsType {
    const params = this.peek("(") ? this.paramsList() : { keywords: {}, positionals: [] };
    if (this.peek("?") || this.peek("{")) { this.block(); }
    this.expect("->");
    const returns = joinTypes(this.optional().types);
    return { proc: { params: params.positionals.map((param) => param.types), returns }, types: ["Proc"] };
  }

  // Skip tokens up to a matching closing bracket
  private skipBalanced(open: string, close: string) {
    let depth = 0;
    do {
      const token = this.tokens[this.position++];
      if (!token) { throw new Error("Unbalanced brackets"); }
      if (token.kind === "punct" && token.value === open) { depth++; }
      if (token.kind === "punct" && token.value === close) { depth--; }
    } while (depth > 0);
  }

  // Is the current token a punctuation
  private peek(value: string): boolean {
    const token = this.tokens[this.position];
    return !!token && token.kind === "punct" && token.value === value;
  }

  // Consume a punctuation if it's the current token
  private accept(value: string): boolean {
    if (!this.peek(value)) { return false; }
    this.position++;
    return true;
  }

  // Consume a punctuation or fail
  private expect(value: string) {
    if (!this.accept(value)) { throw new Error("Expected " + value); }
  }
}
