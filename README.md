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
* Exceptions raised in methods (optional, see `yard.tags.raise` setting).
* Abstract methods raising `NotImplementedError`.
* Deprecated methods warning about their deprecation.
* Classes and Modules.
* Constants.
* Attributes accessors (`attr_reader`, `attr_writer`, `attr_accessor` and more).

Methods named in ASCII and Japanese are supported.

YARD tags are completed in comments, see [Tags completion](#tags-completion).

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
  # @param bar [<Type>] <description>
  # @param baz [<Type>] <description>
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
  # @param bar [Integer] first param used for demonstration
  # @param baz [Boolean] second param with a default value
  #
  # @return [nil] nothing returned so it's always nil
  #
  def foo(bar, baz = false)
  end
```

Done!

### Updating documentation

Run the same command on a documented method, with cursor on the method definition or
anywhere within its comment, to sync documentation with the code. Texts and tags are kept
as they're written, missing tags are added as placeholders:

* Params are reordered to match the method signature. A param which no longer exists is
  renamed if a new param takes its place, otherwise it's removed.
* Missing `@abstract`, `@deprecated`, `@param`, `@option`, `@yield`, `@yieldparam`, `@yieldreturn`, `@raise`
  and `@return` tags are added.
  Documented exceptions are kept even if a method doesn't raise them.
* New tags follow the params style of the existing documentation.

```ruby
#
# Fetch a resource.
#
# @param [String] path resource path
# @param [Integer] retries how many times to retry
#
# @note Raises on timeout.
#
def fetch(url, timeout, retries = 3)
end
```

becomes

```ruby
#
# Fetch a resource.
#
# @param [String] url resource path
# @param [<Type>] timeout <description>
# @param [Integer] retries how many times to retry
#
# @return [<Type>] <description>
#
# @note Raises on timeout.
#
def fetch(url, timeout, retries = 3)
end
```

Documentation of classes, modules, constants and attributes isn't updated.

### Tags completion

Type `@` in a comment to complete YARD tags. Tags missing in documentation of a definition
right below the comment are offered first: undocumented params with their options, block
tags, return value, exceptions raised in a method body, author of a class. Standard YARD
tags follow them.

```ruby
# Fetch a resource.
#
# @param [String] url resource path
# @           <- offers @param retries, @param opts, @yield [response], @return,
#                @raise [ArgumentError], then standard tags like @note, @example
def fetch(url, retries = 3, opts = { timeout: 5 })
  raise ArgumentError, "bad url" unless url
  yield response
end
```

Names are completed after a typed tag: undocumented params after `@param `, block values after
`@yieldparam `, option keys after `@option ` and exception classes after `@raise `.

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

List of generated tags: `@abstract`, `@author`, `@deprecated`, `@option`, `@param`, `@raise`, `@return`, `@yield`,
`@yieldparam`, `@yieldreturn`.

`@author` name and email are taken from git config (`user.name` and `user.email`)
of the repository the document belongs to, or from global git config if it's outside
of a repository. Placeholders are inserted when values can't be resolved.

Splat and block params are named without `*`, `**` and `&` the same way YARD names them,
their types are prefilled with `Array<Object>`, `Hash{Symbol => Object}` and `Proc`. Anonymous
splats and arguments forwarding (`...`) aren't documented since YARD doesn't list them.

Return types of conventional methods are prefilled as placeholders: predicates (`valid?`) and
comparisons (`==`, `<`, `>=` etc.) return `Boolean`, conversions return their classes (`to_s` and
`inspect` return `String`, `to_h` returns `Hash`, `to_i` returns `Integer` and so on), `size`,
`length`, `count` and `hash` return `Integer`, `<=>` and `=~` return `Integer, nil`.

Options hash params, which are params with a hash default value (`opts = {}`) or keyword
splats (`**opts`), get an `@option` tag for each symbol key found in the default hash or read
in the method body (`opts[:key]`, `opts.fetch(:key, default)`, `opts[:key] || default` etc.).
A default value is shown when it's known:

```ruby
#
# <Description>
#
# @param url [<Type>] <description>
# @param opts [<Type>] <description>
# @option opts [<Type>] :timeout (5) <description>
# @option opts [<Type>] :limit (10) <description>
#
# @return [<Type>] <description>
#
def fetch(url, opts = { timeout: 5 })
  limit = opts.fetch(:limit, 10)
end
```

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

Exceptions raised in a method body get a `@raise` tag each, when `yard.tags.raise` setting is
enabled (it's on by default). Exceptions are detected in `raise` and `fail` calls with a class
(`raise ArgumentError`, `raise ArgumentError, "message"`, `raise Net::ReadTimeout.new(...)`),
raising a message is documented as `RuntimeError`. A bare re-raise and exceptions raised in nested
method definitions are skipped:

```ruby
#
# <Description>
#
# @param url [<Type>] <description>
#
# @raise [ArgumentError] <description>
# @raise [RuntimeError] <description>
#
# @return [<Type>] <description>
#
def fetch(url)
  raise ArgumentError, "bad url" unless url
  fail "empty url" if url.empty?
rescue IOError
  raise
end
```

A method whose body only raises `NotImplementedError` is documented as abstract with
an `@abstract` tag, `NotImplementedError` isn't listed with `@raise` then:

```ruby
#
# <Description>
#
# @abstract <description>
#
# @param request [<Type>] <description>
#
# @return [<Type>] <description>
#
def call(request)
  raise NotImplementedError, "#{self.class} must implement #{__method__}"
end
```

A method warning about its deprecation is documented with a `@deprecated` tag. Deprecation warnings
are `warn` calls with a message mentioning a deprecation or with `category: :deprecated`, and `warn`
calls of deprecators like `ActiveSupport::Deprecation.warn` or `MyGem.deprecator.warn`:

```ruby
#
# <Description>
#
# @deprecated <description>
#
# @param url [<Type>] <description>
#
# @return [<Type>] <description>
#
def old_fetch(url)
  warn "old_fetch is deprecated, use fetch instead"
  fetch(url)
end
```

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
"yard.tags.raise" // Document exceptions raised in methods with @raise tags
"yard.tags.paramNameBeforeType" // Print param name before its type (for example '@param username [String]')
"yard.completion.enabled" // Complete YARD tags in comments
```

## Troubleshooting

If hotkey isn't working open VS Code Keyboard Shortcuts and check for keybinging
conflicts.

This also may happen if a documented definition isn't a method or its documentation is
up to date. In this case extension silently does nothing.

Methods with syntax errors in their signature, for example `def foo(bar, baz qux)`, aren't
documented, a status bar message tells about it. Fix the signature and run the command again.
