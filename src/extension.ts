"use strict";
import { commands, ExtensionContext } from "vscode";
import YardGenerator from "./yard_generator";

// This method is called when extension is activated
export function activate(context: ExtensionContext) {
  const yard: YardGenerator = new YardGenerator();
  const command = commands.registerCommand("extension.generateYard", () => {
    return yard.generate();
  });

  context.subscriptions.push(command);
}
