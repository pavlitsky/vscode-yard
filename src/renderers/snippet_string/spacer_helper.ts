"use strict";
import { SnippetString } from "vscode";
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
  private entitiesLength: number = 0;
  private entityIndex: number = 0;

  constructor(private snippet: SnippetString, private eol: string) {}

  // Prepend empty line to an entity if needed
  public beforeEntity(entity: IEntity, entities: IEntity[], index: number) {
    this.updateContext(entity, entities, index);

    if (this.isText || (this.isFirstTagInGroup && this.entitiesLength > 1)) { this.endOfLine(); }
  }

  // Append empty line to an entity if needed
  public afterEntity() {
    if (
      this.isText ||
      this.isTag && (this.entitiesLength > 1 && this.entitiesLength - 1 === this.entityIndex)
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
    this.entitiesLength = entities.length;
    this.entityIndex = index;
    this.isTag = entity instanceof Tag;
    this.isText = entity.type === "Text";

    if (this.isTag) {
      const tag: Tag = entity;
      if (this.lastTag) {
        this.isFirstTagInGroup = tag.tagName !== this.lastTag.tagName;
      } else {
        this.isFirstTagInGroup = true;
      }
      this.isFirstTag = this.tagsCount === 0;
      this.tagsCount += 1;
      this.lastTag = entity;
    } else {
      this.isFirstTag = false;
      this.isFirstTagInGroup = false;
      this.lastTag = undefined;
    }
  }
}
