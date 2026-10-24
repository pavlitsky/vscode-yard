// Low-level entity definition.
// All documentation entities like Tag should implement this interface.
export interface IEntity {
  type: string;
}

// Author's name and email
export interface IAuthorInfo {
  name?: string;
  email?: string;
}

// Environment-dependent details passed to parsers
export interface IParseContext {
  author?: IAuthorInfo;
  // Is documenting of blocks enabled
  blocks?: boolean;
  // Is documenting of raised exceptions enabled
  raises?: boolean;
  // Comments above a definition, rbs-inline annotations are read from them
  comments?: string[];
}
