"use strict";
import * as assert from "assert";
import { readFileSync } from "fs";
import * as path from "path";
import { commands, CompletionItem, CompletionItemKind, CompletionList, extensions, Position, Selection, SnippetString,
  Uri, window, workspace } from "vscode";

const extensionID = "pavlitsky.yard";
const extension = extensions.getExtension(extensionID);
if (!extension) { throw new Error(`Extension ${extensionID} isn't installed`); }
const extensionPath = extension.extensionPath;
const projectPath = path.join(extensionPath, "src", "test", "project");

// Spacers settings: default ones, verbose with all empty lines and curt without empty lines
const defaultSpacers = {
  afterDescription: true,
  afterSingleTag: false,
  afterTags: true,
  beforeDescription: true,
  beforeSingleTag: false,
  beforeTags: true,
  separateTags: true,
};
const verboseSpacers = { ...defaultSpacers, afterSingleTag: true, beforeSingleTag: true };
const curtSpacers = {
  afterDescription: false,
  afterSingleTag: false,
  afterTags: false,
  beforeDescription: false,
  beforeSingleTag: false,
  beforeTags: false,
  separateTags: false,
};

// Git config passed through environment overrides repository, global and system configs
const gitEnv = {
  GIT_CONFIG_COUNT: "2",
  GIT_CONFIG_KEY_0: "user.name",
  GIT_CONFIG_KEY_1: "user.email",
  GIT_CONFIG_VALUE_0: "Test User",
  GIT_CONFIG_VALUE_1: "test@example.com",
};

// Update extension configuration with specified options grouped by sections: spacers, tags etc.
async function updateConfig(options: { [section: string]: { [key: string]: unknown } }) {
  const config = workspace.getConfiguration("yard");
  for (const section of Object.keys(options)) {
    for (const key of Object.keys(options[section])) {
      await config.update(section + "." + key, options[section][key]);
    }
  }
}

// Request completions at a position of a file and return items provided by the extension
async function yardCompletions(fileName: string, line: number, character: number): Promise<CompletionItem[]> {
  const uri = Uri.file(path.join(projectPath, fileName + ".rb"));
  await workspace.openTextDocument(uri);
  const list = await commands.executeCommand<CompletionList>("vscode.executeCompletionItemProvider", uri,
    new Position(line, character));
  return list.items
    .filter((item) => typeof item.detail === "string" && item.detail.startsWith("YARD"))
    .sort((a, b) => (a.sortText ?? "").localeCompare(b.sortText ?? ""));
}

// Labels of completion items missing in documentation, they're sorted before standard tags
function missingTagLabels(items: CompletionItem[]): string[] {
  return items.filter((item) => item.kind !== CompletionItemKind.Keyword).map((item) => item.label as string);
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

// Register a test for each test case documenting its file
function expectDocumented(testCases: string[]) {
  testCases.forEach((testCase) => {
    test(`document ${testCase}`, () => expectFileDocumented(testCase));
  });
}

suite("Default Documenter Tests", () => {
  const configOptions = {
    spacers: defaultSpacers,
    tags: {
      author: true,
      authorFromGit: false,
      paramNameBeforeType: false,
      raise: true,
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
    "method/anonymous_params",
    "method/forwarding",
    "method/post_params",
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
    "method/naming/pipe",
    "method/single_line_spaced",
    "method/malformed_params",
    "method/malformed_default",
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
    "attribute/module_reader",
    "attribute/parentheses",
    "method/update/sync",
    "method/update/rename_options",
    "method/update/kept_tags",
    "method/update/name_first",
    "method/update/initialize",
    "method/update/up_to_date",
    "method/update/class_documented",
    "method/update/splat_names",
    "method/update/malformed",
    "method/raise/raises",
    "method/raise/initializer",
    "method/raise/update",
    "method/raise/update_missing",
    "method/raise/up_to_date",
    "method/abstract/abstract",
    "method/abstract/endless",
    "method/abstract/not_abstract",
    "method/abstract/update",
    "method/abstract/up_to_date",
    "method/deprecated/warn",
    "method/deprecated/category",
    "method/deprecated/deprecator",
    "method/deprecated/active_support",
    "method/deprecated/not_deprecated",
    "method/deprecated/update",
    "method/deprecated/update_abstract",
    "method/return/to_s",
    "method/return/to_h",
    "method/return/spaceship",
    "method/return/equality",
    "method/return/singleton_predicate",
    "method/return/size",
    "method/return/unknown",
    "method/return/update",
    "method/types/defaults",
    "method/types/return_literal",
    "method/types/return_nil",
    "method/types/return_branches",
    "method/types/return_unknown",
    "method/types/return_name_fallback",
    "method/types/return_lambda",
    "method/types/return_multiple",
    "method/types/return_endless",
    "method/sorbet/params",
    "method/sorbet/splats_void",
    "method/sorbet/abstract",
    "method/sorbet/update",
    "method/sorbet/private_def",
    "method/sorbet/attribute",
    "method/sorbet/without_runtime",
    "method/rbs/annotation",
    "method/rbs/update",
    "method/rbs/rbs_params",
    "method/rbs/overloads",
    "method/rbs/malformed",
    "method/nodoc/method",
    "method/nodoc/update",
    "method/nodoc/up_to_date",
    "method/nodoc/class",
    "method/nodoc/constant",
    "method/nodoc/not_nodoc",
    "directive/define_method",
    "directive/concern_included",
    "directive/concern_class_methods",
    "directive/concern_empty",
    "directive/define_singleton_method",
    "directive/define_method_no_block",
    "directive/delegate",
    "directive/delegate_prefix",
    "directive/def_delegators",
    "directive/def_delegator",
    "directive/scope",
    "directive/scope_lambda",
    "directive/has_many",
    "directive/has_many_irregular",
    "directive/belongs_to",
    "directive/has_one",
    "directive/polymorphic",
    "directive/struct",
    "directive/data",
    "directive/struct_superclass",
    "directive/data_superclass",
    "directive/documented",
    "directive/not_a_delegate",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);

  test("document method/update/cursor_on_def", async () => {
    await expectFileDocumented("method/update/cursor_on_def", undefined, 2);
  });

  test("document method/sorbet/cursor_on_def", async () => {
    await expectFileDocumented("method/sorbet/cursor_on_def", undefined, 1);
  });

  test("document method/sorbet/not_a_sig", async () => {
    await expectFileDocumented("method/sorbet/not_a_sig", undefined, 1);
  });

  test("document method/rbs/cursor_on_def", async () => {
    await expectFileDocumented("method/rbs/cursor_on_def", undefined, 1);
  });

  test("document method/update/magic_comment", async () => {
    await expectFileDocumented("method/update/magic_comment", undefined, 1);
  });
});

suite("Verbose Documenter Tests", () => {
  const configOptions = {
    spacers: verboseSpacers,
    tags: {
      author: true,
      authorFromGit: false,
      paramNameBeforeType: false,
      raise: true,
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
    spacers: curtSpacers,
    tags: {
      author: false,
      authorFromGit: false,
      paramNameBeforeType: false,
      raise: true,
      yield: false,
    },
  };

  const testCases = [
    "curt/class",
    "curt/instance_two_params",
    "curt/options_hash_param",
    "curt/options_keys",
    "curt/update",
    "curt/raise",
    "curt/abstract",
    "curt/deprecated",
    "curt/struct",
    "curt/constant",
    "curt/attribute",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Special options", () => {
  const configOptions = {
    spacers: defaultSpacers,
    tags: {
      author: true,
      authorFromGit: false,
      paramNameBeforeType: true, // Non default
      raise: true,
      yield: false,
    },
  };

  const testCases = [
    "special/param_name_before_types"
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Raise disabled", () => {
  const configOptions = {
    spacers: defaultSpacers,
    tags: {
      author: false,
      authorFromGit: false,
      paramNameBeforeType: false,
      raise: false, // Non default
      yield: false,
    },
  };

  const testCases = [
    "method/raise/disabled",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Overloads Documenter Tests", () => {
  const configOptions = {
    spacers: defaultSpacers,
    tags: {
      author: false,
      authorFromGit: false,
      overload: true, // Non default
      paramNameBeforeType: false,
      raise: true,
      yield: false,
    },
  };

  const testCases = [
    "method/overload/annotations",
    "method/overload/optional",
    "method/overload/splat",
    "method/overload/keywords",
    "method/overload/rbs_method",
    "method/overload/update",
    "method/overload/update_documented",
    "method/overload/update_params",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  suiteTeardown(async () => { await updateConfig({ tags: { overload: undefined } }); });
  expectDocumented(testCases);

  test("document method/overload/block", async () => {
    await updateConfig({ tags: { yield: true } });
    await expectFileDocumented("method/overload/block");
    await updateConfig({ tags: { yield: false } });
  });

  test("complete overloads missing in method documentation", async () => {
    const items = await yardCompletions("completion/overload", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@overload convert(value)", "@overload convert(value)"]);
    assert.equal((items[0].insertText as SnippetString).value,
      "@overload convert(value)\n#   @param [Integer] value ${1:<description>}\n#   @return [String] ${2:<description>}");
  });
});

suite("Author from git", () => {
  const configOptions = {
    spacers: defaultSpacers,
    tags: {
      author: true,
      authorFromGit: true,
      paramNameBeforeType: true,
      raise: true,
      yield: false,
    },
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
    spacers: defaultSpacers,
    tags: {
      author: false,
      authorFromGit: false,
      paramNameBeforeType: true,
      raise: true,
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
    "method/yield/raise",
    "method/yield/sorbet",
    "method/yield/rbs",
    "method/yield/define_method",
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
    spacers: curtSpacers,
    tags: {
      author: false,
      authorFromGit: false,
      paramNameBeforeType: true,
      raise: true,
      yield: true,
    },
  };

  const testCases = [
    "curt/yield",
  ];

  suiteSetup(async () => { await updateConfig(configOptions); });
  expectDocumented(testCases);
});

suite("Tags Completion Tests", () => {
  const configOptions = {
    completion: {
      enabled: true,
    },
    spacers: defaultSpacers,
    tags: {
      author: true,
      authorFromGit: true,
      paramNameBeforeType: false,
      raise: true,
      yield: false,
    },
  };

  suiteSetup(async () => {
    await updateConfig(configOptions);
    Object.assign(process.env, gitEnv);
  });
  suiteTeardown(() => {
    Object.keys(gitEnv).forEach((key) => delete process.env[key]);
  });

  test("complete tags missing in method documentation", async () => {
    const items = await yardCompletions("completion/method", 3, 3);
    assert.deepEqual(missingTagLabels(items), [
      "@param retries", "@param opts", "@yield [response]", "@return", "@raise [ArgumentError]", "@raise [RuntimeError]",
    ]);
    const param = items.find((item) => item.label === "@param opts");
    assert.ok(param);
    assert.equal((param.insertText as SnippetString).value,
      "@param [${1:Hash}] opts ${2:<description>}\n# @option opts [${3:Integer}] :timeout (5) ${4:<description>}");
    assert.ok(items.some((item) => item.label === "@note" && item.kind === CompletionItemKind.Keyword));
  });

  test("complete abstract tag of a method raising NotImplementedError", async () => {
    const items = await yardCompletions("completion/abstract", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@abstract", "@param request", "@return"]);
    const abstract = items.find((item) => item.label === "@abstract");
    assert.ok(abstract);
    assert.equal((abstract.insertText as SnippetString).value, "@abstract ${1:<description>}");
  });

  test("complete private tag of a method hidden with nodoc", async () => {
    const items = await yardCompletions("completion/nodoc", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@private", "@return"]);
    assert.equal((items[0].insertText as SnippetString).value, "@private");
  });

  test("complete deprecated tag of a method warning about deprecation", async () => {
    const items = await yardCompletions("completion/deprecated", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@deprecated", "@return"]);
  });

  test("complete return value of a predicate method with a types placeholder", async () => {
    const items = await yardCompletions("completion/return", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@return"]);
    assert.equal((items[0].insertText as SnippetString).value, "@return [${1:Boolean}] ${2:<description>}");
  });

  test("complete tags typed by Sorbet sig of a method below", async () => {
    const items = await yardCompletions("completion/sorbet", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@param url", "@return"]);
    assert.equal((items[0].insertText as SnippetString).value, "@param [String] url ${1:<description>}");
  });

  test("complete parts missing in documented sections", async () => {
    const items = await yardCompletions("completion/gaps", 5, 3);
    assert.deepEqual(missingTagLabels(items), ["@option opts :timeout", "@yieldparam value", "@yieldreturn"]);
  });

  test("complete author of a class", async () => {
    const items = await yardCompletions("completion/class", 1, 3);
    assert.deepEqual(missingTagLabels(items), ["@author Test User <test@example.com>"]);
  });

  test("complete names after tags", async () => {
    assert.deepEqual(missingTagLabels(await yardCompletions("completion/names", 1, 9)), ["retries", "opts"]);
    assert.deepEqual(missingTagLabels(await yardCompletions("completion/names", 2, 9)), ["[ArgumentError]"]);
    const options = await yardCompletions("completion/names", 3, 10);
    assert.deepEqual(missingTagLabels(options), ["opts :timeout"]);
    assert.equal((options[0].insertText as SnippetString).value,
      "opts [${1:Integer}] :timeout (5) ${2:<description>}");
  });

  test("complete only standard tags in a comment not documenting a definition", async () => {
    const items = await yardCompletions("completion/not_comment", 0, 3);
    assert.deepEqual(missingTagLabels(items), []);
    assert.ok(items.length > 0);
  });

  test("complete only standard tags above a method with malformed params", async () => {
    const items = await yardCompletions("completion/malformed", 0, 3);
    assert.deepEqual(missingTagLabels(items), []);
    assert.ok(items.length > 0);
  });

  test("don't complete outside of whole line comments", async () => {
    assert.deepEqual(await yardCompletions("completion/not_comment", 3, 13), []);
    assert.deepEqual(await yardCompletions("completion/not_comment", 4, 7), []);
  });

  test("don't complete if disabled", async () => {
    await updateConfig({ completion: { enabled: false } });
    assert.deepEqual(await yardCompletions("completion/method", 3, 3), []);
    await updateConfig({ completion: { enabled: true } });
  });
});

suite("Extension Tests", () => {
  test("should be present", () => {
    assert.ok(extensions.getExtension(extensionID));
  });
});
