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
  // Is documenting of overloaded methods with @overload tags enabled
  overloads?: boolean;
  // Comments above a definition, rbs-inline annotations are read from them
  comments?: string[];
  // Comment trailing code on a line, RDoc's ':nodoc:' is read from it
  trailingComment?: (line: number) => string | undefined;
  // Comments within lines of a definition, TODO notes are read from them
  commentsWithin?: (startLine: number, endLine: number) => string[];
  // Is documenting of TODO notes with @todo tags enabled
  todos?: boolean;
}
