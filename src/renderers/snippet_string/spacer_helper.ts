"use strict";
import { SnippetString, workspace, WorkspaceConfiguration } from "vscode";
import { Tag } from "../../entities/tag";
import { IEntity } from "../../types";

// Helper class to manage empty lines of a snippet
export class SpacerHelper {
  private lastTag = undefined;
  private isFirstTag: boolean = false;
  private isFirstTagInGroup: boolean = false;
  private isTag: boolean = false;
  private isText: boolean = false;
  private tagsCount: number = 0;
  private isSingleEntity: boolean = false;
  private isLastEntity: boolean = false;
  private isSingleTag: boolean = false;

  private config: WorkspaceConfiguration;

  constructor(private snippet: SnippetString, private eol: string) {
    this.config = workspace.getConfiguration("yard.spacers");
  }

  // Prepend empty line to an entity if needed
  public beforeEntity(entity: IEntity, entities: IEntity[], index: number) {
    this.updateContext(entity, entities, index);

    const beforeDescription = this.isText;
    const beforeTags = this.isFirstTag && !this.isSingleTag;
    const separateTags = !this.isFirstTag && this.isFirstTagInGroup && !this.isSingleEntity;
    const beforeSingleTag = this.isSingleTag;

    if (
      (beforeDescription && this.config.get("beforeDescription")) ||
      (beforeTags && this.config.get("beforeTags")) ||
      (separateTags && this.config.get("separateTags")) ||
      (beforeSingleTag && this.config.get("beforeSingleTag"))
    ) {
      this.endOfLine();
    }
  }

  // Append empty line to an entity if needed
  public afterEntity() {
    const afterDescription = this.isText;
    const afterTags = this.isTag && (!this.isSingleEntity && this.isLastEntity);
    const afterSingleTag = this.isSingleTag;

    if (
      (afterDescription && this.config.get("afterDescription")) ||
      (afterTags && this.config.get("afterTags")) ||
      (afterSingleTag && this.config.get("afterSingleTag"))
    ) {
      this.endOfLine();
    }
  }

  // Append empty line to a snippet
  public endOfLine() {
    this.snippet.appendText(this.eol);
  }

  // Update context parameters for a current entity
  private updateContext(entity: IEntity, entities: IEntity[], index: number) {
    this.isTag = entity instanceof Tag;
    this.isText = entity.type === "Text";
    this.isLastEntity = entities.length - 1 === index;
    this.isSingleEntity = entities.length === 1;

    if (this.isTag) {
      const tag: Tag = entity;
      if (this.lastTag) {
        this.isFirstTagInGroup = tag.tagName !== this.lastTag.tagName;
      } else {
        this.isFirstTagInGroup = true;
      }
      this.isFirstTag = this.tagsCount === 0;
      this.isSingleTag = this.isSingleEntity;
      this.tagsCount += 1;
      this.lastTag = entity;
    } else {
      this.isFirstTag = false;
      this.isFirstTagInGroup = false;
      this.isSingleTag = false;
      this.lastTag = undefined;
    }
  }
}
