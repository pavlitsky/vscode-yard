"use strict";
import type { ArgumentsNode, CallNode, LocalVariableReadNode, Node, SplatNode, YieldNode }
  from "@ruby/prism" with { "resolution-mode": "import" };
import { isNode, walk } from "../ast/prism";

// Block usage found in a method body
export interface IBlockUsage {
  // Is block accepted by the method
  usesBlock: boolean;
  // Names of values passed to the block, empty string if name is unknown
  params: string[];
}

// Detect block usage in a method body: yield calls, block_given? checks and explicit block param calls
export class BlockUsage {
  // Nested scopes where yield doesn't belong to the method
  private readonly scopes = ["DefNode", "ClassNode", "ModuleNode", "SingletonClassNode"];
  // Methods calling a block: block.call(a), block.(a), block[a], block.yield(a)
  private readonly blockCalls = ["call", "[]", "yield", "==="];

  constructor(private body: Node | null, private acceptsBlock: boolean = false, private blockName?: string) {}

  // Detect block usage
  public detect(): IBlockUsage {
    let usesBlock = this.acceptsBlock;
    let args: Node[] = [];
    if (this.body) {
      walk(this.body, (node) => {
        if (this.scopes.some((scope) => isNode(node, scope))) { return false; }
        if (this.isBlockGiven(node)) { usesBlock = true; }
        const callArgs = this.callArguments(node);
        if (callArgs) {
          usesBlock = true;
          if (callArgs.length > args.length) { args = callArgs; }
        }
      });
    }
    return { usesBlock, params: args.map((arg) => this.paramName(arg)) };
  }

  // Is node a block_given? check
  private isBlockGiven(node: Node): boolean {
    return isNode<CallNode>(node, "CallNode") && !node.receiver && node.name === "block_given?";
  }

  // Arguments of a yield or a block param call, undefined if node isn't a block call
  private callArguments(node: Node): Node[] | undefined {
    if (isNode<YieldNode>(node, "YieldNode")) { return this.argumentsList(node.arguments_); }
    if (this.blockName && isNode<CallNode>(node, "CallNode") && this.blockCalls.indexOf(node.name) >= 0 &&
      isNode<LocalVariableReadNode>(node.receiver, "LocalVariableReadNode") && node.receiver.name === this.blockName) {
      return this.argumentsList(node.arguments_);
    }
  }

  // List arguments of a call
  private argumentsList(args: ArgumentsNode | null): Node[] {
    return args ? args.arguments_ : [];
  }

  // Get param name from a passed argument: a local variable or a method call looking like a variable ('yield foo'),
  // empty string for other expressions
  private paramName(arg: Node): string {
    const value = isNode<SplatNode>(arg, "SplatNode") ? arg.expression : arg;
    if (isNode<LocalVariableReadNode>(value, "LocalVariableReadNode")) { return value.name; }
    if (isNode<CallNode>(value, "CallNode") && value.isVariableCall()) { return value.name; }
    return "";
  }
}
