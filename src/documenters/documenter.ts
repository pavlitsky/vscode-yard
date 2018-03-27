// Interface each documenter should implement
export interface IDocumenter {
  isApplicable(): boolean;
  buildSnippet(eol: string);
}
