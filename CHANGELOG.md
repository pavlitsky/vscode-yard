# Changelog

## Unreleased

- Change `yard.tags.paramNameBeforeType` setting to be `true` by default.
- Resolve `@author` name and email from git config, configurable with `yard.tags.authorFromGit` setting.
- Document blocks with `@yield`, `@yieldparam` and `@yieldreturn` tags, enabled with `yard.tags.yield` setting.
- Parse source code with [Prism](https://github.com/ruby/prism) instead of regular expressions. Fixes documenting
  definitions spanning multiple lines, single line methods with parameters, attributes defined with parentheses
  and `class << self` blocks.
- Require VS Code 1.90 or newer.
- Document keys of options hash params with `@option` tags: keys of a default hash value and keys read
  in a method body, including keyword splats (`**opts`).
- Update existing documentation of methods with the same command: sync params with the method signature
  and add missing tags, keeping written texts and tags. Command also works with cursor within a comment.
- Don't document or update methods with syntax errors in their signature, a status bar message tells about it
  ([#3](https://github.com/pavlitsky/vscode-yard/issues/3)). Operator methods like `|` get their params right.
- Name splat and block params without `*`, `**` and `&` to match YARD, prefill their types and skip anonymous
  params and arguments forwarding, which YARD warned about. Updating documentation renames such params too.
- Complete YARD tags in comments, tags missing in documentation of a definition below are offered first.
  Names are completed after `@param`, `@yieldparam`, `@option` and `@raise` tags. Can be disabled with
  `yard.completion.enabled` setting.
- Document exceptions raised in methods with `@raise` tags, configurable with `yard.tags.raise` setting.
  Updating documentation adds tags of undocumented exceptions.
- Document methods which only raise `NotImplementedError` with `@abstract` tag.
- Document methods warning about their deprecation with `@deprecated` tag.
- Prefill return types of predicates, comparisons, conversions like `to_s` and size methods.
- Prefill types of params and options with literal default values, and return types of methods returning
  literal values.
- Fill in types declared by Sorbet signatures (`sig { params(...).returns(...) }`) and rbs-inline annotations
  (`#: (String) -> bool`, `# @rbs name: String`). Documentation is placed above `sig` and above `#:` annotations.
- Document methods overloaded by several rbs-inline method types with `@overload` tags, enabled with
  `yard.tags.overload` setting.
- Document methods and attributes YARD doesn't see with `@!method` and `@!attribute` directives: `define_method`,
  `delegate`, `def_delegators`, Rails scopes and associations.
- Document members of Struct and Data classes with `@attr` and `@attr_reader` tags.

## [0.4.0] - 2020-03-23

- Add an configuration option for the `@param` tag to render name-before-type variant,
  i.e. `@param username [String]` ([#8](https://github.com/pavlitsky/vscode-yard/pull/8)).

## [0.3.2] - 2019-06-01

- Fix keyboard shortcut for Mac
- Document attributes accessors with `@return` tag instead of an `@!attribute` directive.
  ([@MicMicMon](https://github.com/MicMicMon))

## [0.3.1] - 2018-10-18

- Fix documenting methods which parameters aren't enclosed in parentheses. ([@pablox-cl](https://github.com/pablox-cl))

## [0.3.0] - 2018-04-08

- Add ability to document attributes accessors (`attr_reader`, `attr_writer`,
  `attr_accessor` and more).

## [0.2.2] - 2018-04-05

- Update README with more examples.

## [0.2.1] - 2018-04-03

- Improve method name detection. Added operators (like `def >>; end`)
 and Japanese symbols detection.
- Fix detection of methods ending with `!?=`.

## [0.2.0] - 2018-04-03

- Add configuration options.

## [0.1.0] - 2018-03-27

- Initial release.
