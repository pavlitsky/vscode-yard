"use strict";
import * as assert from "assert";
import { readFileSync } from "fs";
import * as path from "path";
import { commands, extensions, TextDocument, TextEditor, window, workspace } from "vscode";

const extensionID = "pavlitsky.yard";
const extensionPath = extensions.getExtension(extensionID).extensionPath;
const fixturesPath = path.join(extensionPath, "src", "test", "fixtures");

// Assert that processed file contains the same result as expected file
function expectFileDocumented(fileName: string) {
  let textDocument: TextDocument;
  let editor: TextEditor;
  let generatedText: string;

  return workspace.openTextDocument(path.join(fixturesPath, fileName + ".rb")).then((document) => {
        textDocument = document;
        return window.showTextDocument(document);
      }).then((textEditor) => {
        editor = textEditor;
        return commands.executeCommand("extension.generateYard");
      }).then(() => {
        generatedText = editor.document.getText();
        return commands.executeCommand("workbench.action.closeActiveEditor");
      }).then(() => {
        const expectedText = readFileSync(path.join(fixturesPath, fileName + "_expected.rb"), "utf8");
        assert.equal(generatedText, expectedText);
      });
    }

suite("Extension Tests", () => {
  test("should be present", () => {
    assert.ok(extensions.getExtension(extensionID));
  });

  // All fixtures paths to run expectations for
  const testCases = [
    "non_commentable",
    "existing_comment",
    "method/identation",
    "method/spaced_params",
    "method/instance_single_param",
    "method/instance_two_params",
    "method/default_params",
    "method/splat_params",
    "method/options_hash_param",
    "method/block_param",
    "method/empty_params",
    "method/single_line",
    "method/single_line_parentheses",
    "method/initializer",
    "method/class_single_param",
    "class_or_module/class",
    "class_or_module/module",
    "class_or_module/namespaced",
    "class_or_module/namespaced_and_nested",
    "constant/constant",
    "constant/constant_spaced",
  ].forEach ((testCase) => {
    test(`document ${testCase}`, () => expectFileDocumented(testCase));
  });
});
