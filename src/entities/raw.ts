import { IEntity } from "../types";

// Lines of an existing documentation kept as they're written
export class Raw implements IEntity {
  public lines: string[];
  public type: string;

  constructor(params: Partial<Raw> = {}) {
    const {
      lines = [],
      type = "Raw",
    } = params;

    this.lines = lines;
    this.type = type;
  }
}
