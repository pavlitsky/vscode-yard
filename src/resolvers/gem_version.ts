"use strict";
import { promises as fs } from "fs";
import * as path from "path";
import { TextDocument, workspace } from "vscode";

// Version assigned in a gemspec: spec.version = "1.2.0"
const GEMSPEC_VERSION_PATTERN = /\.version\s*=\s*["']([^"']+)["']/;
// Version constant of a gem: VERSION = "1.2.0"
const VERSION_CONSTANT_PATTERN = /\bVERSION\s*=\s*["']([^"']+)["']/;

// Resolve version of a gem a document belongs to. The gem is the nearest directory with a gemspec
// up from the document within its workspace folder. Version is read from the gemspec or from lib/**/version.rb.
export class GemVersionResolver {
  // Depth of directories below lib looked through for version.rb
  private readonly maxDepth = 3;

  constructor(private document: TextDocument) {}

  // Resolve gem version, undefined if it's unknown. Never rejects.
  public async resolve(): Promise<string | undefined> {
    try {
      const root = await this.gemRoot();
      if (!root) { return; }
      const gemspec = await this.read(path.join(root.directory, root.gemspec));
      const version = GEMSPEC_VERSION_PATTERN.exec(gemspec ?? "")?.[1];
      if (version) { return version; }
      const name = path.basename(root.gemspec, ".gemspec");
      const preferred = path.join(root.directory, "lib", ...name.split("-"), "version.rb");
      const files = [preferred].concat(await this.versionFiles(path.join(root.directory, "lib"), 0));
      for (const file of files) {
        const match = VERSION_CONSTANT_PATTERN.exec(await this.read(file) ?? "");
        if (match) { return match[1]; }
      }
    } catch {
      return;
    }
  }

  // Nearest directory with a gemspec up from the document, it isn't looked up above the workspace folder
  private async gemRoot(): Promise<{ directory: string; gemspec: string } | undefined> {
    if (this.document.uri.scheme !== "file") { return; }
    const folder = workspace.getWorkspaceFolder(this.document.uri);
    const top = folder ? folder.uri.fsPath : path.parse(this.document.uri.fsPath).root;
    let directory = path.dirname(this.document.uri.fsPath);
    while (directory.startsWith(top)) {
      const gemspec = (await fs.readdir(directory)).find((file) => file.endsWith(".gemspec"));
      if (gemspec) { return { directory, gemspec }; }
      const parent = path.dirname(directory);
      if (parent === directory) { return; }
      directory = parent;
    }
  }

  // Files named version.rb within a directory and its subdirectories
  private async versionFiles(directory: string, depth: number): Promise<string[]> {
    if (depth > this.maxDepth) { return []; }
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
    const files = entries.filter((entry) => entry.isFile() && entry.name === "version.rb")
      .map((entry) => path.join(directory, entry.name));
    for (const entry of entries.filter((e) => e.isDirectory())) {
      files.push(...await this.versionFiles(path.join(directory, entry.name), depth + 1));
    }
    return files;
  }

  // Read a file, undefined if it can't be read
  private read(file: string): Promise<string | undefined> {
    return fs.readFile(file, "utf8").catch(() => undefined);
  }
}
