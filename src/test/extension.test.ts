"use strict";
import * as assert from "assert";
import { readFileSync } from "fs";
import * as path from "path";
import { commands, ConfigurationTarget, extensions, TextDocument, TextEditor, Uri, window, workspace,
  WorkspaceConfiguration } from "vscode";

const extensionID = "pavlitsky.yard";
const extensionPath = extensions.getExtension(extensionID).extensionPath;
const projectPath = path.join(extensionPath, "src", "test", "project");
const workspacePath = path.join(extensionPath, "out", "test");

// Update extension configuration with specified options
async function updateConfig(options) {
  const config = workspace.getConfiguration("yard");
  for (const key of Object.keys(options.spacers)) {
    await config.update("spacers." + key, options.spacers[key]);
  }
  for (const key of Object.keys(options.tags)) {
    await config.update("tags." + key, options.tags[key]);
  }
}

// Assert that processed file contains the same result as expected file
async function expectFileDocumented(fileName: string) {
  const textDocument = await workspace.openTextDocument(path.join(projectPath, fileName + ".rb"));
  const editor = await window.showTextDocument(textDocument);
  await commands.executeCommand("extension.generateYard");
  const generatedText = editor.document.getText();
  await commands.executeCommand("workbench.action.closeActiveEditor");
  const expectedText = readFileSync(path.join(projectPath, fileName + "_expected.rb"), "utf8");
  return assert.equal(generatedText, expectedText);
}

async function expectDocumented(testCases) {
  testCases.forEach (async (testCase) => {
    await test(`document ${testCase}`, async () => await expectFileDocumented(testCase));
  });
}

suite("Default Documenter Tests", () => {
  const configOptions = {
    spacers: {
      afterDescription: true,
      afterSingleTag: false,
      afterTags: true,
      beforeDescription: true,
      beforeSingleTag: false,
      beforeTags: true,
      separateTags: true,
    },
    tags: {
      author: true,
    },
  };

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
    "method/without_parentheses",
    "method/naming/setter",
    "method/naming/bang",
    "method/naming/boolean",
    "method/naming/operator",
    "method/naming/element",
    "method/naming/element_assignment",
    "method/naming/unary",
    "method/naming/japanese_hello",
    "method/naming/leet",
    "class_or_module/class",
    "class_or_module/module",
    "class_or_module/namespaced",
    "class_or_module/namespaced_and_nested",
    "constant/constant",
    "constant/constant_spaced",
    "attribute/reader",
    "attribute/writer",
    "attribute/accessor",
    "attribute/class_accessor",
    "attribute/class_attribute",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Verbose Documenter Tests", () => {
  const configOptions = {
    spacers: {
      afterDescription: true,
      afterSingleTag: true,
      afterTags: true,
      beforeDescription: true,
      beforeSingleTag: true,
      beforeTags: true,
      separateTags: true,
    },
    tags: {
      author: true,
    },
  };

  const testCases = [
    "verbose/class",
    "verbose/instance_two_params",
    "verbose/options_hash_param",
    "verbose/constant",
    "verbose/directive",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Curt Documenter Tests", () => {
  const configOptions = {
    spacers: {
      afterDescription: false,
      afterSingleTag: false,
      afterTags: false,
      beforeDescription: false,
      beforeSingleTag: false,
      beforeTags: false,
      separateTags: false,
    },
    tags: {
      author: false,
    },
  };

  const testCases = [
    "curt/class",
    "curt/instance_two_params",
    "curt/options_hash_param",
    "curt/constant",
    "curt/directive",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Extension Tests", () => {
  test("should be present", () => {
    assert.ok(extensions.getExtension(extensionID));
  });
});
