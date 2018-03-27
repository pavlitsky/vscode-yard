"use strict";
import { SnippetString } from "vscode";

// Build documentation snippet
export class SnippetBuilder {
  private snippet: SnippetString;

  constructor(private eol: string) {
    this.snippet = new SnippetString();
  }

  // Decorate each snippet line with a comment and return rebuilt snippet string
  public build() {
    const lines: string[] = this.snippet.value.split(this.eol);
    lines.pop(); // Remove the newline of the snippet string itself
    const decoratedLines: string = lines
      .map((line) => "#" + (line ? " " + line : ""))
      .join(this.eol) + this.eol;
    return new SnippetString(decoratedLines);
  }

  // Append empty line
  public spacer() {
    this.snippet.appendText(this.eol);
  }

  // Append description line
  // <Description>
  public description() {
    this.snippet.appendPlaceholder("<Description>");
    this.snippet.appendText(this.eol);
  }

  // Tags builders

  // Append @param tag line
  // @param [<Type>] name <description>
  public param(name, defaultValue) {
    this.snippet.appendText("@param [");
    this.snippet.appendPlaceholder("<Type>] ");
    this.snippet.appendText(name + " ");
    this.snippet.appendPlaceholder("<description>");
    this.snippet.appendText(this.eol);
  }

  // Append @return tag line
  // @return [<Type>] <description>
  public return() {
    this.snippet.appendText("@return [");
    this.snippet.appendPlaceholder("<Type>");
    this.snippet.appendText("] ");
    this.snippet.appendPlaceholder("<description>");
    this.snippet.appendText(this.eol);
  }

  // Append @option tag line
  // @option name [<Type>] :<key> <description>
  public option(name) {
    this.snippet.appendText("@option " + name + " [");
    this.snippet.appendPlaceholder("<Type>");
    this.snippet.appendText("] :");
    this.snippet.appendPlaceholder("<key>");
    this.snippet.appendText(" ");
    this.snippet.appendPlaceholder("<description>");
    this.snippet.appendText(this.eol);
  }

  // Append @author tag line
  // @author Name <<email>>
  public author() {
    this.snippet.appendText("@author ");
    this.snippet.appendPlaceholder("<Name>");
    this.snippet.appendText(" <");
    this.snippet.appendPlaceholder("<email>");
    this.snippet.appendText(">");
    this.snippet.appendText(this.eol);
  }
}
