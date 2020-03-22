"use strict";
import { SnippetString, workspace, WorkspaceConfiguration } from "vscode";
import { Author } from "../entities/author";
import { Directive } from "../entities/directive";
import { TagOption } from "../entities/tag_option";
import { TagWithOptions } from "../entities/tag_with_options";
import { TagWithTypes } from "../entities/tag_with_types";
import { IEntity } from "../types";
import { SpacerHelper } from "./snippet_string/spacer_helper";

// Render documentation tree into a snippet
export class Renderer {
  private snippet: SnippetString;
  private spacer: SpacerHelper;
  private config: WorkspaceConfiguration;

  constructor(private entities: IEntity[], private eol: string) {
    this.config = workspace.getConfiguration("yard.tags");
  }

  // Render entities and return documentation snippet
  public render(): SnippetString {
    this.snippet = new SnippetString();
    this.spacer = new SpacerHelper(this.snippet, this.eol);
    this.entities.forEach((entity, index, entities) => {
      if (!this.shouldRenderEntity(entity)) { return; }
      this.spacer.beforeEntity(entity, entities, index);
      this.renderEntity(entity);
      this.spacer.afterEntity();
    });
    return this.decorateSnippet();
  }

  // Is entity should be rendered
  private shouldRenderEntity(entity): boolean {
    if (entity.type === "Author" && !this.config.get("author")) { return false; }
    return true;
  }

  // Render a single entity depending of its type
  private renderEntity(entity) {
    switch (entity.type) {
      case("Directive"): this.directiveEntity(entity); break;
      case("Author"): this.authorEntity(entity); break;
      case("TagOption"): this.tagOptionEntity(entity); break;
      case("TagWithOptions"): this.tagWithOptionsEntity(entity); break;
      case("TagWithTypes"): this.tagWithTypesEntity(entity); break;
      case("Text"): this.textEntity(entity); break;
    }
  }

  // Render a directive
  // @!attribute [r] foo_bar
  //   @return [<Type>] <description>
  private directiveEntity(entity: Directive) {
    this.snippet.appendText("@!" + entity.tagName);
    if (entity.tagTypes) { this.typesList(entity.tagTypes); }
    this.snippet.appendText(" " + entity.name);
    this.spacer.endOfLine();
    entity.entities.forEach((e) => {
      this.snippet.appendText("  "); // nested entities get two spaces identation
      this.renderEntity(e);
    });
  }

  // Render an @author tag line
  // @author Name <<email>>
  private authorEntity(entity: Author) {
    this.snippet.appendText("@author ");
    this.textOrPlaceholder(entity.authorName, "<Name>");
    this.snippet.appendText(" <");
    this.textOrPlaceholder(entity.authorEmail, "<email>");
    this.snippet.appendText(">");
    this.spacer.endOfLine();
  }

  // Render an @option tag line
  // @option paramName [types] :<key> <description>
  private tagOptionEntity(entity: TagOption) {
    this.snippet.appendText("@option " + entity.paramName);
    this.typesList(entity.types);
    this.snippet.appendText(" :");
    this.textOrPlaceholder(entity.key, "<key>");
    this.snippet.appendText(" ");
    this.textOrPlaceholder(entity.text, "<description>");
    this.spacer.endOfLine();
  }

  // Render a tag with a types and options line
  // @tagName [types] name <description>
  // @option paramName [types] :<key> <description>
  private tagWithOptionsEntity(entity: TagWithOptions) {
    this.tagWithTypesEntity(entity);
    entity.options.forEach((option) => { this.tagOptionEntity(option); });
  }

  // Render a tag with a types line
  // @tagName [types] name <description>
  private tagWithTypesEntity(entity: TagWithTypes) {
    this.snippet.appendText("@" + entity.tagName);
    this.typesList(entity.types);
    if (entity.name) { this.snippet.appendText(" " + entity.name); }
    this.snippet.appendText(" ");
    this.textOrPlaceholder(entity.text, "<description>");
    this.spacer.endOfLine();
  }

  // Render a descriptive text line
  // <Description>
  private textEntity(entity) {
    this.textOrPlaceholder(entity.text, "<Description>");
    this.spacer.endOfLine();
  }

  // Render a text or a placeholder if text is empty
  private textOrPlaceholder(text, placeholder) {
    if (text) {
      this.snippet.appendText(text);
    } else {
      this.snippet.appendPlaceholder(placeholder);
    }
  }

  // Render entity types list
  // [types]
  private typesList(types: string) {
    this.snippet.appendText(" [");
    this.textOrPlaceholder(types, "<Type>");
    this.snippet.appendText("]");
  }

  // Decorate the snippet and return a rebuilt one.
  // Snippet is prepended with a comment symbol, also consecutive empty lines are stripped.
  private decorateSnippet() {
    let lines: string[] = this.snippet.value.split(this.eol);
    lines = lines.filter((element, position, array) => {
      return (position === 0 || element !== array[position - 1]) && position < array.length - 1;
    });
    const decoratedLines: string = lines
      .map((line) => "#" + (line ? " " + line : ""))
      .join(this.eol) + this.eol;
    return new SnippetString(decoratedLines);
  }
}
