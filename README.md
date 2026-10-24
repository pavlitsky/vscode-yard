# YARD Documenter

Extension generates [YARD](https://yardoc.org/) documentation comments for Ruby
source code.

See [Readme](http://www.rubydoc.info/gems/yard/file/README.md) for more
information on this tool.

## Features

Extension automatically prepends definitions of methods, classes etc with
documentation snippets.
No need to remember a formatting tags and styling, just type and describe your code.

It's able to document:

* Methods: instance methods, initializers, class methods.
* Blocks accepted by methods (optional, see `yard.tags.yield` setting).
* Classes and Modules.
* Constants.
* Attributes accessors (`attr_reader`, `attr_writer`, `attr_accessor` and more).

Methods named in ASCII and Japanese are supported.

## Usage

Position cursor on a first line of a definition you wish to document.

```ruby
def foo(bar, baz = false) # <- put cursor at any place of this line
end
```

Hit `Ctrl+Alt+Enter` (`Option+Command+Enter` on macOS) or invoke `Document with YARD`
from the command palette.

```ruby
  #
  # <Description>
  #
  # @param [<Type>] bar <description>
  # @param [<Type>] baz <description>
  #
  # @return [<Type>] <description>
  #
  def foo(bar, baz = false)
  end
```

Documentation snippet appears on top of the method.

Use `Tab` and `Shift+Tab` keys to navigate and fill in placeholders.

```ruby
  #
  # An example instance method description.
  #
  # @param [Integer] bar first param used for demonstration
  # @param [Boolean] baz second param with a default value
  #
  # @return [nil] nothing returned so it's always nil
  #
  def foo(bar, baz = false)
  end
```

Done!

Another snippets examples, default spacers setup:

```ruby
#
# Class to retry and fail.
#
# @author Author Name <author@example.com>
#
class Foo
  # @return [Integer] count of retries performed before failing
  RETRIES_COUNT=3

  # @return [Boolean] retry operation result
  attr_accessor :succeed

  #
  # Retry something.
  #
  # @return [Boolean] processing result, true if succeed
  #
  def retry
    RETRIES_COUNT.times { puts 'Retrying...' }
    @succeed = false
  end
end
```

Minimal setup:

```ruby
# Class to retry and fail.
class Foo
  # @return [Integer] count of retries performed before failing
  RETRIES_COUNT=3

  # @return [Boolean] retry operation result
  attr_accessor :succeed

  # Retry something.
  # @return [Boolean] processing result, true if succeed
  def retry
    RETRIES_COUNT.times { puts 'Retrying...' }
    @succeed = false
  end
end
```

Feel free to append any needed tags like `@note`, `@example`, `@see` manually
after snippet filled in.

## Details

Source code is parsed with [Prism](https://github.com/ruby/prism), the Ruby's own parser,
so definitions spanning multiple lines and any Ruby syntax are supported.
Requires VS Code 1.90 or newer.

List of generated tags: `@author`, `@option`, `@param`, `@return`, `@yield`,
`@yieldparam`, `@yieldreturn`.

`@author` name and email are taken from git config (`user.name` and `user.email`)
of the repository the document belongs to, or from global git config if it's outside
of a repository. Placeholders are inserted when values can't be resolved.

Blocks are documented when `yard.tags.yield` setting is enabled. Method body is
looked through for `yield`, `block_given?` and calls of an explicit `&block` param,
values passed to the block become `@yieldparam` tags:

```ruby
#
# <Description>
#
# @param prefix [<Type>] <description>
#
# @yield [key, value] <description>
# @yieldparam key [<Type>] <description>
# @yieldparam value [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
```

An explicit `&block` param is documented with these tags instead of `@param`.
When a passed value isn't a plain local variable (for example `yield @items.first`)
its name is left as a placeholder, filled in once for both `@yield` and `@yieldparam`.

## Configuration

Insertion of empty lines are configurable to make it able to tune between
a curt and verbose documentation styles.

```ts
"yard.spacers.beforeDescription" // Prepend an empty line to descriptive texts
"yard.spacers.afterDescription" // Append an empty line to descriptive texts
"yard.spacers.beforeTags" // Prepend an empty line to all method's tags
"yard.spacers.separateTags" // Separate method's tags of the same name (@params and @return) with an empty line
"yard.spacers.afterTags" // Append an empty line to all method's tags
"yard.spacers.beforeSingleTag" // Prepend an empty line to directives or single tags (for example constants)
"yard.spacers.afterSingleTag" // Append an empty line to directives or single tags (for example constants)
"yard.tags.author" // Append @author tag to Class and Module documentation
"yard.tags.authorFromGit" // Fill @author name and email from git config (user.name and user.email)
"yard.tags.yield" // Document blocks of methods with @yield, @yieldparam and @yieldreturn tags
"yard.tags.paramNameBeforeType" // Print param name before its type (for example '@param username [String]')
```

## TODO

* Support for non-empty options hash parameters.
* (killer feature :fire:) Ability to update existing documentation.
* (maybe) Editor snippets for tags (`@option`, `@param` etc) or tags autocompletion
* (maybe) A better support for array / keyword args splats, see
  [comment](https://github.com/lsegal/yard/issues/439#issuecomment-3292412).

## Troubleshooting

If hotkey isn't working open VS Code Keyboard Shortcuts and check for keybinging
conflicts.

This also may happen if destination is already documented. In this case extension
silently does nothing.
