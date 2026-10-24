// Low-level entity definition.
// All docomentation entities like Tag should implement this interface.
export interface IEntity {
  type?: string;
}

// Author's name and email
export interface IAuthorInfo {
  name?: string;
  email?: string;
}

// Environment-dependent details passed to parsers
export interface IParseContext {
  author?: IAuthorInfo;
  // Method body lines, present when documenting of blocks is enabled
  body?: string[];
}
