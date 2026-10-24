"use strict";
import { commands, ExtensionContext, languages } from "vscode";
import { TagCompletionProvider } from "./completion/provider";
import YardDocumenter from "./yard_documenter";

// This method is called when extension is activated
export function activate(context: ExtensionContext) {
  const yard: YardDocumenter = new YardDocumenter();
  const command = commands.registerCommand("extension.generateYard", () => {
    return yard.generate();
  });
  // Tags are completed after '@', names are completed after a space following a tag
  const completion = languages.registerCompletionItemProvider({ language: "ruby" }, new TagCompletionProvider(),
    "@", " ");

  context.subscriptions.push(command, completion);
}
