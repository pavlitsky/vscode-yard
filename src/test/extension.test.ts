"use strict";
import * as assert from "assert";
import { readFileSync } from "fs";
import * as path from "path";
import { commands, ConfigurationTarget, extensions, Selection, TextDocument, TextEditor, Uri, window, workspace,
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

// Assert that processed file contains the same result as expected file.
// Snippet can be filled in with an optional callback before comparison. Cursor is put on a first line by default.
async function expectFileDocumented(fileName: string, fillSnippet?: () => Promise<void>, line: number = 0) {
  const textDocument = await workspace.openTextDocument(path.join(projectPath, fileName + ".rb"));
  const editor = await window.showTextDocument(textDocument);
  editor.selection = new Selection(line, 0, line, 0);
  await commands.executeCommand("extension.generateYard");
  if (fillSnippet) { await fillSnippet(); }
  const generatedText = editor.document.getText();
  await commands.executeCommand("workbench.action.closeActiveEditor");
  const expectedText = readFileSync(path.join(projectPath, fileName + "_expected.rb"), "utf8");
  return assert.equal(generatedText, expectedText);
}

// Wait until active editor's selected text matches the expected one, snippet placeholders are selected asynchronously
async function waitForSelection(text: string, timeout: number = 2000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const editor = window.activeTextEditor;
    if (editor && editor.document.getText(editor.selection) === text) { return; }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(`Selection "${text}" expected`);
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
      authorFromGit: false,
      paramNameBeforeType: false,
      yield: false,
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
    "method/options/literal_keys",
    "method/options/body_keys",
    "method/options/merged_keys",
    "method/options/keyword_rest",
    "method/options/keyword_param",
    "method/options/skipped_keys",
    "method/options/nested_def",
    "method/block_param",
    "method/empty_params",
    "method/single_line",
    "method/single_line_parentheses",
    "method/initializer",
    "method/class_single_param",
    "method/without_parentheses",
    "method/multiline_params",
    "method/single_line_body_params",
    "method/private_def",
    "method/singleton_class",
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
    "constant/constant_path",
    "attribute/reader",
    "attribute/writer",
    "attribute/accessor",
    "attribute/class_accessor",
    "attribute/class_attribute",
    "attribute/parentheses",
    "method/update/sync",
    "method/update/rename_options",
    "method/update/kept_tags",
    "method/update/name_first",
    "method/update/initialize",
    "method/update/up_to_date",
    "method/update/class_documented",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);

  test("document method/update/cursor_on_def", async () => {
    await expectFileDocumented("method/update/cursor_on_def", undefined, 2);
  });

  test("document method/update/magic_comment", async () => {
    await expectFileDocumented("method/update/magic_comment", undefined, 1);
  });
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
      authorFromGit: false,
      paramNameBeforeType: false,
      yield: false,
    },
  };

  const testCases = [
    "verbose/class",
    "verbose/instance_two_params",
    "verbose/options_hash_param",
    "verbose/constant",
    "verbose/attribute",
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
      authorFromGit: false,
      paramNameBeforeType: false,
      yield: false,
    },
  };

  const testCases = [
    "curt/class",
    "curt/instance_two_params",
    "curt/options_hash_param",
    "curt/options_keys",
    "curt/update",
    "curt/constant",
    "curt/attribute",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Special options", () => {
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
      authorFromGit: false,
      paramNameBeforeType: true, // Non default
      yield: false,
    },
  };

  const testCases = [
    "special/param_name_before_types"
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Author from git", () => {
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
      authorFromGit: true,
      paramNameBeforeType: true,
      yield: false,
    },
  };

  // Git config passed through environment overrides repository, global and system configs
  const gitEnv = {
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "user.name",
    GIT_CONFIG_KEY_1: "user.email",
    GIT_CONFIG_VALUE_0: "Test User",
    GIT_CONFIG_VALUE_1: "test@example.com",
  };

  const testCases = [
    "author/class",
    "author/module",
  ];

  suiteSetup(async () => {
    await updateConfig(configOptions);
    Object.assign(process.env, gitEnv);
  });
  suiteTeardown(() => {
    Object.keys(gitEnv).forEach((key) => delete process.env[key]);
  });
  expectDocumented(testCases);
});

suite("Blocks Documenter Tests", () => {
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
      author: false,
      authorFromGit: false,
      paramNameBeforeType: true,
      yield: true,
    },
  };

  const testCases = [
    "method/yield/implicit_args",
    "method/yield/parentheses",
    "method/yield/no_args",
    "method/yield/block_given",
    "method/yield/expression",
    "method/yield/arity",
    "method/yield/block_param",
    "method/yield/block_param_stored",
    "method/yield/single_line",
    "method/yield/nested",
    "method/yield/not_a_block",
    "method/yield/nested_def",
    "method/yield/heredoc",
    "method/yield/multiline_params",
    "method/yield/update",
    "method/yield/update_partial",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);

  test("document method/yield/linked_name", async () => {
    await expectFileDocumented("method/yield/linked_name", async () => {
      await waitForSelection("<Description>");
      await commands.executeCommand("jumpToNextSnippetPlaceholder");
      await waitForSelection("<name>");
      await commands.executeCommand("type", { text: "item" });
    });
  });
});

suite("Curt Blocks Documenter Tests", () => {
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
      authorFromGit: false,
      paramNameBeforeType: true,
      yield: true,
    },
  };

  const testCases = [
    "curt/yield",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Extension Tests", () => {
  test("should be present", () => {
    assert.ok(extensions.getExtension(extensionID));
  });
});
