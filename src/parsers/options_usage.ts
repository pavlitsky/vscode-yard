"use strict";
import type { AssocNode, CallNode, HashNode, IndexOrWriteNode, LocalVariableReadNode, Node, OrNode, SymbolNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, walkScope } from "../ast/prism";

// Option of an options hash
export interface IOption {
  // Option key name without a colon
  key: string;
  // Default value source, empty string if unknown
  defaultValue: string;
}

// Detect options hash keys: keys of a default hash literal and keys read from the hash in a method body.
// Only symbol keys are detected. Default value is known if all sources agree on it.
export class OptionsUsage {
  // Methods reading a hash key passed as a first argument: opts[:a], opts.fetch(:a, 1), opts.key?(:a) etc.
  private readonly keyReaders = ["[]", "fetch", "key?", "has_key?", "include?", "member?", "dig", "delete"];
  // Longer default values aren't documented to keep comments readable
  private readonly maxDefaultLength = 40;
  // Keys in order of appearance
  private keys: string[] = [];
  // Default values found for each key
  private defaults: { [key: string]: string[] } = {};

  constructor(private name: string, private defaultHash: Node | null, private body: Node | null) {}

  // Detect options
  public detect(): IOption[] {
    this.keys = [];
    this.defaults = {};
    if (isNode<HashNode>(this.defaultHash, "HashNode")) {
      this.defaultHash.elements.forEach((element) => {
        if (isNode<AssocNode>(element, "AssocNode")) { this.add(this.symbolName(element.key), element.value); }
      });
    }
    walkScope(this.body, (node) => this.visit(node));
    return this.keys.map((key) => ({ key, defaultValue: this.defaultValue(key) }));
  }

  // Collect keys and defaults from a node of a method body
  private visit(node: Node) {
    if (isNode<CallNode>(node, "CallNode") && this.isKeyReader(node.receiver, node.name)) {
      const [key, fallback] = node.arguments_ ? node.arguments_.arguments_ : [];
      this.add(this.symbolName(key), node.name === "fetch" ? fallback : undefined);
    } else if (isNode<OrNode>(node, "OrNode") && isNode<CallNode>(node.left, "CallNode") && node.left.name === "[]" &&
      this.isKeyReader(node.left.receiver, node.left.name)) {
      // opts[:a] || 1
      this.add(this.symbolName(node.left.arguments_ ? node.left.arguments_.arguments_[0] : undefined), node.right);
    } else if (isNode<IndexOrWriteNode>(node, "IndexOrWriteNode") && this.isKeyReader(node.receiver, "[]")) {
      // opts[:a] ||= 1
      this.add(this.symbolName(node.arguments_ ? node.arguments_.arguments_[0] : undefined), node.value);
    }
  }

  // Is it a call of a key reading method on the options hash
  private isKeyReader(receiver: Node | null, method: string): boolean {
    return isNode<LocalVariableReadNode>(receiver, "LocalVariableReadNode") && receiver.name === this.name &&
      this.keyReaders.indexOf(method) >= 0;
  }

  // Register a key and its default value
  private add(key: string | undefined, fallback?: Node) {
    if (!key) { return; }
    if (this.keys.indexOf(key) < 0) {
      this.keys.push(key);
      this.defaults[key] = [];
    }
    if (fallback) { this.defaults[key].push(fallback.location.slice()); }
  }

  // Default value of a key if it's the same in all sources and short enough
  private defaultValue(key: string): string {
    const values = this.defaults[key].filter((value, index, all) => all.indexOf(value) === index);
    if (values.length !== 1) { return ""; }
    const [value] = values;
    return value.indexOf("\n") < 0 && value.length <= this.maxDefaultLength ? value : "";
  }

  // Name of a symbol literal, undefined for other nodes
  private symbolName(node: Node | undefined): string | undefined {
    return isNode<SymbolNode>(node, "SymbolNode") ? node.unescaped.value : undefined;
  }
}
