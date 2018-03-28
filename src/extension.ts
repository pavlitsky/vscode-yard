"use strict";
import { commands, ExtensionContext } from "vscode";
import YardDocumenter from "./yard_documenter";

// This method is called when extension is activated
export function activate(context: ExtensionContext) {
  const yard: YardDocumenter = new YardDocumenter();
  const command = commands.registerCommand("extension.generateYard", () => {
    return yard.generate();
  });

  context.subscriptions.push(command);
}
