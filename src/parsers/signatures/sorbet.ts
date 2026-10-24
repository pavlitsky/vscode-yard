"use strict";
import type {
  ArrayNode, AssocNode, BlockNode, CallNode, KeywordHashNode, Node, StatementsNode, SymbolNode,
} from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, nodeType } from "../../ast/prism";
import { genericType, IProcTypes, ISignature, joinTypes } from "./signature";

// Sorbet's generics named after Ruby classes: T::Array[String] is Array<String>
const GENERICS = ["Array", "Class", "Enumerable", "Enumerator", "Hash", "Range", "Set"];
// Types of T methods without arguments
const T_TYPES: { [name: string]: string } = {
  anything: "Object", attached_class: "self", self_type: "self", untyped: "Object",
};
// Ruby classes standing for YARD types
const CLASS_TYPES: { [name: string]: string } = {
  FalseClass: "Boolean", NilClass: "nil", "T::Boolean": "Boolean", TrueClass: "Boolean",
};

// Is node a Sorbet signature: sig { ... }, sig(:final) { ... } or T::Sig::WithoutRuntime.sig { ... }
export function isSig(node: Node | null | undefined): node is CallNode {
  if (!isNode<CallNode>(node, "CallNode") || node.name !== "sig" || !isNode(node.block, "BlockNode")) { return false; }
  return !node.receiver || node.receiver.location.slice().replace(/^::/, "") === "T::Sig::WithoutRuntime";
}

// Read types of a method from Sorbet signature:
// sig { params(name: String, retries: T.nilable(Integer)).returns(T::Boolean) }
export class SorbetSignature {
  constructor(private sig: CallNode) {}

  // Signature types, undefined if the signature can't be read
  public parse(): ISignature | undefined {
    const body = (this.sig.block as BlockNode).body;
    if (!isNode<StatementsNode>(body, "StatementsNode") || body.body.length !== 1) { return; }
    const signature: ISignature = { params: {} };
    this.chain(body.body[0]).forEach((call) => {
      const [arg] = call.arguments_ ? call.arguments_.arguments_ : [];
      if (call.name === "params") {
        this.keywords(arg).forEach(([name, type]) => {
          if (isProc(type)) { signature.block = this.procTypes(type); }
          signature.params[name] = this.types(type);
        });
      } else if (call.name === "returns") {
        signature.returns = this.types(arg);
      } else if (call.name === "void") {
        signature.returns = "void";
      } else if (call.name === "abstract") {
        signature.abstract = true;
      }
    });
    return signature;
  }

  // YARD types list of a Sorbet type, undefined if it's unknown
  public types(node: Node | undefined): string | undefined {
    return joinTypes(this.typesOf(node));
  }

  // Types of a Sorbet type, a union consists of several types
  private typesOf(node: Node | null | undefined): (string | undefined)[] | undefined {
    if (!node) { return; }
    if (isConstant(node)) {
      const name = node.location.slice().replace(/^::/, "");
      return [CLASS_TYPES[name] ?? name.replace(/^T::/, "")];
    }
    if (isNode<ArrayNode>(node, "ArrayNode")) {
      const elements = node.elements.map((element) => this.types(element));
      return elements.some((element) => element === undefined) ? undefined : ["Array(" + elements.join(", ") + ")"];
    }
    if (nodeType(node) === "HashNode") { return ["Hash"]; }
    if (!isNode<CallNode>(node, "CallNode")) { return; }
    if (isProc(node, false)) { return ["Proc"]; }
    const args = node.arguments_ ? node.arguments_.arguments_ : [];
    if (node.name === "[]" && isConstant(node.receiver)) {
      const name = (node.receiver as Node).location.slice().replace(/^::/, "");
      const generic = name.replace(/^T::/, "");
      if (name.startsWith("T::") && GENERICS.indexOf(generic) < 0) { return; }
      return [genericType(generic, args.map((arg) => this.types(arg)))];
    }
    if (!this.isT(node.receiver)) { return; }
    if (node.name === "nilable" && args.length === 1) { return (this.typesOf(args[0]) ?? [undefined]).concat("nil"); }
    if (node.name === "any") { return args.flatMap((arg) => this.typesOf(arg) ?? [undefined]); }
    if (node.name === "class_of" && args.length === 1) { return [genericType("Class", [this.types(args[0])])]; }
    if (node.name === "type_parameter") { return ["Object"]; }
    return args.length === 0 && T_TYPES[node.name] ? [T_TYPES[node.name]] : undefined;
  }

  // Types of a proc: T.proc.params(value: Integer).returns(String), nilable procs are unwrapped
  private procTypes(node: Node): IProcTypes {
    const proc = unwrapNilable(node) as CallNode;
    const types: IProcTypes = { params: [] };
    this.chain(proc).forEach((call) => {
      const [arg] = call.arguments_ ? call.arguments_.arguments_ : [];
      if (call.name === "params") { types.params = this.keywords(arg).map(([, type]) => this.types(type)); }
      if (call.name === "returns") { types.returns = this.types(arg); }
      if (call.name === "void") { types.returns = "void"; }
    });
    return types;
  }

  // Calls of a chain from the first one: override.params(...).returns(...)
  private chain(node: Node): CallNode[] {
    const calls: CallNode[] = [];
    let current: Node | null = node;
    while (isNode<CallNode>(current, "CallNode")) {
      calls.unshift(current);
      current = current.receiver;
    }
    return calls;
  }

  // Keyword arguments as names and values: params(name: String)
  private keywords(node: Node | undefined): [string, Node][] {
    if (!isNode<KeywordHashNode>(node, "KeywordHashNode")) { return []; }
    return node.elements.flatMap((element) =>
      isNode<AssocNode>(element, "AssocNode") && isNode<SymbolNode>(element.key, "SymbolNode") ?
        [[element.key.unescaped.value, element.value] as [string, Node]] : []);
  }

  // Is node a T constant
  private isT(node: Node | null): boolean {
    return isConstant(node) && (node as Node).location.slice().replace(/^::/, "") === "T";
  }
}

// Inner type of T.nilable(type), the type itself otherwise
function unwrapNilable(node: Node): Node {
  if (isNode<CallNode>(node, "CallNode") && node.name === "nilable" && node.arguments_ &&
    node.arguments_.arguments_.length === 1) {
    return node.arguments_.arguments_[0];
  }
  return node;
}

// Is node a constant reference: Foo or Foo::Bar
function isConstant(node: Node | null | undefined): boolean {
  return ["ConstantReadNode", "ConstantPathNode"].indexOf(nodeType(node)) >= 0;
}

// Is node a proc type, it's nilable if allowed: T.proc.params(...).returns(...)
function isProc(node: Node, nilable: boolean = true): boolean {
  let current: Node | null = nilable ? unwrapNilable(node) : node;
  while (isNode<CallNode>(current, "CallNode")) {
    if (current.name === "proc" && current.receiver && current.receiver.location.slice().replace(/^::/, "") === "T") {
      return true;
    }
    current = current.receiver;
  }
  return false;
}
