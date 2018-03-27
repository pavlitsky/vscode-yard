"use strict";
import documenters from "./documenters/all";

// Get first suitable documenter for supplied text string
export default class DocumenterResolver {

  constructor(private text: string) { }

  // Instantiate each documenter and check if it's ready to document the text
  public resolve() {
    for (const documenter of documenters) {
      const d = new documenter(this.text);
      if (d.isApplicable()) { return d; }
    }
    return undefined;
  }
}
