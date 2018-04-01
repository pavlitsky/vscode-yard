import { IEntity } from "../types";

// Single block of a descriptive text for a method or a class.
export class Text implements IEntity {
  public text?: string;
  public type?;

  constructor(params: Text = {} as Text) {
    const {
      text = "",
      type = "Text",
    } = params;

    this.text = text;
    this.type = type;
  }
}
