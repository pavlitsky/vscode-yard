"use strict";

// Block usage found in a method source
export interface IBlockUsage {
  // Is block accepted by the method
  usesBlock: boolean;
  // Names of values passed to the block, empty string if name is unknown
  params: string[];
}

// Detect block usage in a method source: yield calls, block_given? checks and explicit block calls.
// Source is inspected line by line with string literals and comments stripped.
export class BlockUsage {
  // Keywords and operators which end call arguments list
  private readonly argumentsEnd = /^\s+(?:(?:if|unless|while|until|and|or|rescue|then|do|end)\b|&&|\|\|)/;
  // Operators which follow a call without arguments
  private readonly operators = /^\s+(?:\?|:|=|<|>|\+\s|-\s|\*\s|\/|%\s)/;
  // Names which aren't suitable as block param names
  private readonly reservedNames = ["nil", "self", "true", "false", "super"];

  constructor(private lines: string[], private acceptsBlock: boolean = false, private blockName?: string) {}

  // Detect block usage
  public detect(): IBlockUsage {
    let usesBlock = this.acceptsBlock;
    let args: string[] = [];
    this.lines.map((line) => this.strip(line)).forEach((line) => {
      if (/\bblock_given\?/.test(line)) { usesBlock = true; }
      this.callsArguments(line).forEach((callArgs) => {
        usesBlock = true;
        if (callArgs.length > args.length) { args = callArgs; }
      });
    });
    return { usesBlock, params: args.map((arg) => this.paramName(arg)) };
  }

  // Strip string literals contents and a comment from a line
  private strip(line: string): string {
    return line
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/#.*$/, "");
  }

  // Find block calls in a line and return arguments list of each call
  private callsArguments(line: string): string[][] {
    const callees = ["yield\\b(?![?!])"];
    if (this.blockName) { callees.push(this.blockName + "(?:\\.call\\b|\\.(?=\\()|(?=\\[))"); }
    const regExp = new RegExp("(?<![\\w.:@$])(?:" + callees.join("|") + ")", "g");
    const calls: string[][] = [];
    let match: RegExpExecArray;
    while ((match = regExp.exec(line)) !== null) {
      calls.push(this.callArguments(line.slice(match.index + match[0].length)));
    }
    return calls;
  }

  // Extract call arguments from a text following the callee
  private callArguments(text: string): string[] {
    if (/^[(\[]/.test(text)) { return this.splitArguments(text.slice(1), true); }
    const hasArguments = /^\s+[^\s;)\]}]/.test(text) && !this.argumentsEnd.test(text) && !this.operators.test(text);
    return hasArguments ? this.splitArguments(text, false) : [];
  }

  // Split arguments list on top level commas until it ends
  private splitArguments(text: string, enclosed: boolean): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ("([{".indexOf(char) >= 0) {
        depth += 1;
      } else if (")]}".indexOf(char) >= 0) {
        if (depth === 0) { break; }
        depth -= 1;
      } else if (depth === 0 && char === ",") {
        args.push(current);
        current = "";
        continue;
      } else if (depth === 0 && !enclosed && (char === ";" || this.argumentsEnd.test(text.slice(i)))) {
        break;
      }
      current += char;
    }
    args.push(current);
    return args.map((arg) => arg.trim()).filter((arg) => arg !== "");
  }

  // Get param name from a passed argument, empty string if argument isn't a plain local name
  private paramName(arg: string): string {
    const name = arg.replace(/^(?:\*\*|\*|&)/, "");
    if (!/^[a-z_][a-zA-Z0-9_]*$/.test(name) || this.reservedNames.indexOf(name) >= 0) { return ""; }
    return name;
  }
}
