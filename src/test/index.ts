import { readdirSync } from "fs";
import Mocha from "mocha";
import * as path from "path";

// Entry point called by VS Code test host, runs all *.test.js files of this directory
export function run(): Promise<void> {
  const mocha = new Mocha({
    color: true,
    timeout: 10000,
    ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
  });

  readdirSync(__dirname)
    .filter((file) => file.endsWith(".test.js"))
    .forEach((file) => mocha.addFile(path.join(__dirname, file)));

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
