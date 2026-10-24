import * as path from "path";
import { runTests } from "@vscode/test-electron";

// Download VS Code, launch it with the extension and run the test suite
async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const extensionTestsPath = path.resolve(__dirname, "./index");
    const workspacePath = path.resolve(__dirname, "../../src/test/project");
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath, "--disable-extensions"],
    });
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exit(1);
  }
}

main();
