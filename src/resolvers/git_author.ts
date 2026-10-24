"use strict";
import { execFile } from "child_process";
import * as path from "path";
import { TextDocument, workspace } from "vscode";
import { IAuthorInfo } from "../types";

// Resolve author's name and email from git config.
// Repository config is used when document is inside a repo, global config otherwise.
export class GitAuthorResolver {
  private readonly timeout = 1000;

  constructor(private document: TextDocument) {}

  // Resolve author info, never rejects
  public async resolve(): Promise<IAuthorInfo> {
    const cwd = this.workingDirectory();
    const [name, email] = await Promise.all([
      this.gitConfig("user.name", cwd),
      this.gitConfig("user.email", cwd),
    ]);
    return { name, email };
  }

  // Directory to run git in: document's directory or a first workspace folder
  private workingDirectory(): string | undefined {
    if (this.document.uri.scheme === "file") {
      return path.dirname(this.document.uri.fsPath);
    }
    const folders = workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
  }

  // Path to git executable, respects VS Code's 'git.path' setting
  private gitPath(): string {
    const configured = workspace.getConfiguration("git").get("path");
    return typeof configured === "string" && configured ? configured : "git";
  }

  // Read a git config value, resolves with undefined on any failure
  private gitConfig(key: string, cwd?: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      try {
        execFile(this.gitPath(), ["config", "--get", key], { cwd, timeout: this.timeout }, (error, stdout) => {
          const value = error ? "" : stdout.toString().trim();
          resolve(value || undefined);
        });
      } catch (e) {
        resolve(undefined);
      }
    });
  }
}
