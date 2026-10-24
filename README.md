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
* Methods overloaded by rbs-inline annotations (optional, see `yard.tags.overload` setting).
* Abstract methods raising `NotImplementedError`.
* Deprecated methods warning about their deprecation.
* Definitions hidden from RDoc with `# :nodoc:`, with `@private` tag.
* TODO notes written in methods, with `@todo` tags (optional, see `yard.tags.todo` setting).
* Methods overriding methods of a superclass, with `@see` tags (optional, see `yard.tags.see` setting).
* Version of a gem new definitions are added in, with `@since` tag (optional, see `yard.tags.since` setting).
* Classes and Modules.
* Constants.
* Attributes accessors (`attr_reader`, `attr_writer`, `attr_accessor` and more).
* Struct and Data classes (`Point = Struct.new(:x, :y)`, `Point = Data.define(:x, :y)`).
* Methods and attributes YARD doesn't see, with `@!method` and `@!attribute` directives:
  `define_method`, delegated methods (`delegate`, `def_delegators`), Rails scopes, associations and
  class attributes (`class_attribute`, `cattr_accessor`, `mattr_reader`), methods of
  `ActiveSupport::Concern` blocks (`included do`, `class_methods do`).

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
  # @param baz [Boolean] <description>
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
* Missing `@abstract`, `@deprecated`, `@private`, `@param`, `@option`, `@overload`, `@yield`, `@yieldparam`,
  `@yieldreturn`, `@raise`, `@return`, `@see` and `@todo` tags are added.
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

Documentation of classes, modules, constants, attributes and directives isn't updated.

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

List of generated tags: `@abstract`, `@attr`, `@attr_reader`, `@author`, `@deprecated`, `@option`,
`@overload`, `@param`, `@private`, `@raise`, `@return`, `@see`, `@since`, `@todo`, `@yield`, `@yieldparam`, `@yieldreturn`. Generated directives:
`@!attribute`, `@!method`.

`@author` name and email are taken from git config (`user.name` and `user.email`)
of the repository the document belongs to, or from global git config if it's outside
of a repository. Placeholders are inserted when values can't be resolved.

Splat and block params are named without `*`, `**` and `&` the same way YARD names them,
their types are prefilled with `Array<Object>`, `Hash{Symbol => Object}` and `Proc`. Anonymous
splats and arguments forwarding (`...`) aren't documented since YARD doesn't list them.

Types declared by a [Sorbet](https://sorbet.org/) signature or an [rbs-inline](https://github.com/soutaro/rbs-inline)
annotation are filled in for params, block params, block return value and return value. Sorbet's
and RBS types are written as YARD types: `T.nilable(String)` and `String?` are `String, nil`,
`T::Array[Integer]` and `Array[Integer]` are `Array<Integer>`, `T::Boolean` and `bool` are `Boolean`,
`T.untyped` and `untyped` are `Object`, `.void` and `void` are `void` and so on. Splat params are
declared with types of their elements, they're documented as `Array<...>` and `Hash{Symbol => ...}`.

Documentation goes above Sorbet `sig`, the same way [yard-sorbet](https://github.com/dduugg/yard-sorbet)
expects it, put cursor on either `sig` or `def` line. A method declared `abstract` gets `@abstract` tag,
`attr_reader` and other attributes get their types from `sig` too:

```ruby
#
# <Description>
#
# @param url [String] <description>
# @param retries [Integer, nil] <description>
#
# @return [Boolean] <description>
#
sig { params(url: String, retries: T.nilable(Integer)).returns(T::Boolean) }
def fetch(url, retries = nil)
end
```

rbs-inline `#:` annotation stays right above a method, documentation goes above it. A method type
is read from a single `#:` annotation or `# @rbs (...) -> ...` comment, see [Overloads](#overloads)
for methods with several of them. Types of single params are read from `# @rbs name: Type` comments:

```ruby
#
# <Description>
#
# @param url [String] <description>
# @param tags [Array<Symbol>] <description>
#
# @return [String, nil] <description>
#
#: (String url, *Symbol tags) -> String?
def fetch(url, *tags)
end
```

Otherwise types are prefilled as placeholders when they're known, so they can be kept or typed over:

* Types of params and options with literal default values: `retries = 3` is `Integer`, `opts = {}`
  is `Hash`, `format: :json` is `Symbol`, `cache = Set.new` is `Set`, `parent = nil` is `Object, nil`.
* Return types of methods returning literal values, both the last expression and explicit `return`
  values are looked through, including `if` and `unless` branches:

  ```ruby
  # @return [Record, nil] <description>
  def record
    return nil if @id.nil?
    Record.new(@id)
  end
  ```

* Otherwise return types of conventional methods: predicates (`valid?`) and comparisons (`==`, `<`,
  `>=` etc.) return `Boolean`, conversions return their classes (`to_s` and `inspect` return `String`,
  `to_h` returns `Hash`, `to_i` returns `Integer` and so on), `size`, `length`, `count` and `hash`
  return `Integer`, `<=>` and `=~` return `Integer, nil`.

Options hash params, which are params with a hash default value (`opts = {}`) or keyword
splats (`**opts`), get an `@option` tag for each symbol key found in the default hash or read
in the method body (`opts[:key]`, `opts.fetch(:key, default)`, `opts[:key] || default` etc.).
A default value is shown when it's known:

```ruby
#
# <Description>
#
# @param url [<Type>] <description>
# @param opts [Hash] <description>
# @option opts [Integer] :timeout (5) <description>
# @option opts [Integer] :limit (10) <description>
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

A method, a class, a module, a constant or an attribute hidden from RDoc with a `# :nodoc:` comment
trailing its first line is documented with a `@private` tag, YARD doesn't read RDoc's directive.
It's hidden from YARD documentation generated with `--no-private` option:

```ruby
#
# <Description>
#
# @private
#
# @return [<Type>] <description>
#
def internal_state # :nodoc:
end
```

TODO notes written in comments within a method get a `@todo` tag each, when `yard.tags.todo`
setting is enabled. Notes are comments starting with `TODO`, `FIXME`, `XXX`, `HACK` or `OPTIMIZE`,
written on their own lines or trailing code. Updating documentation adds tags of undocumented notes,
documented notes are kept:

```ruby
#
# <Description>
#
# @param url [<Type>] <description>
#
# @return [<Type>] <description>
#
# @todo retry on timeout
# @todo handle redirects
#
def fetch(url)
  # TODO: retry on timeout
  get(url) # FIXME handle redirects
end
```

A method calling `super` refers to the method it overrides with a `@see` tag, when `yard.tags.see`
setting is enabled. YARD doesn't link overridden methods, and documentation of a method isn't
inherited once it's documented. The overridden method is looked up in a superclass written as a constant,
methods of `class << self` and `def self.name` methods refer to class methods. Methods of modules
and blocks don't get the tag, `super` goes to an unknown ancestor there:

```ruby
class Admin < Base::User
  #
  # <Description>
  #
  # @return [<Type>] <description>
  #
  # @see Base::User#name
  #
  def name
    super.upcase
  end
end
```

New documentation of methods, classes, modules, constants and attributes ends with a `@since` tag,
when `yard.tags.since` setting is enabled. Its version is a placeholder prefilled with a version
of the gem a document belongs to, so it can be kept or typed over with a next version. The gem
is the nearest directory with a gemspec up from the document, version is read from the gemspec
(`spec.version = "1.4.0"`) or from `VERSION` constant of `lib/**/version.rb`. Updating
documentation doesn't add `@since` tag, existing definitions aren't new:

```ruby
#
# <Description>
#
# @return [<Type>] <description>
#
# @since 1.4.0
#
def fetch
end
```

### Overloads

A method with several rbs-inline method types, written as several `#:` annotations or as
`# @rbs (...) -> ...` comment followed by `#   | (...) -> ...` lines, gets an `@overload` tag
for each method type when `yard.tags.overload` setting is enabled. Otherwise its tags aren't typed.
Params of an overload are named after the method params they match by position or by keyword name,
otherwise after names written in the method type. Unknown names are placeholders filled in together
with the param tag:

```ruby
#
# <Description>
#
# @overload find(id)
#   @param id [Integer] <description>
#   @return [User] <description>
# @overload find(<name>, limit = <default>)
#   @param <name> [String] <description>
#   @param limit [Integer] <description>
#   @return [Array<User>] <description>
#
#: (Integer id) -> User
#: (String, ?Integer limit) -> Array[User]
def find(*args)
end
```

Updating documentation adds overloads if a method has none of them documented, documented overloads
are kept as they're written. Documentation with params or return value documented without overloads
is updated the usual way.

### Directives

Methods and attributes defined by calls aren't seen by YARD unless they're documented with
`@!method` and `@!attribute` directives, their documentation is nested in a directive:

```ruby
# @!method greet(name, greeting = "Hello")
#   <Description>
#   @param name [<Type>] <description>
#   @param greeting [String] <description>
#   @return [String] <description>
define_method(:greet) do |name, greeting = "Hello"|
  "#{greeting}, #{name}"
end
```

* `define_method` and `define_singleton_method` with a block or a lambda are documented the same way
  methods are.
* Each method delegated with Rails `delegate` (including its `prefix:` option) and Forwardable's
  `def_delegators` and `def_delegator` gets its own `@!method` directive.
* Rails `scope` is documented as a class method returning `ActiveRecord::Relation`.
* Rails `has_many`, `has_one`, `belongs_to` and `has_and_belongs_to_many` are documented with
  `@!attribute [rw]` directives. Their types are guessed from association names or `class_name:`
  options: `has_many :categories` returns `ActiveRecord::Associations::CollectionProxy<Category>`,
  `belongs_to :author, class_name: "User", optional: true` returns `User, nil`.
* Rails class attributes defined with `class_attribute`, `cattr_*` and `mattr_*` get an
  `@!attribute` directive each, named with `self.` the way YARD tells class attributes:
  `cattr_accessor :host` is documented with `@!attribute [rw] self.host`.
* YARD doesn't look into `included do`, `prepended do` and `class_methods do` blocks of
  `ActiveSupport::Concern`, even comments within them are lost. Documenting the block puts
  directives above it: `@!method` for each method, methods of `class_methods` are class methods,
  `@!attribute` for each attribute, and directives of scopes, associations and delegated methods.
  Methods following `private` or `protected` aren't documented.

  ```ruby
  # @!attribute [rw] comments
  #   <Description>
  #   @return [ActiveRecord::Associations::CollectionProxy<Comment>] <description>
  # @!method publish(at = Time.now)
  #   <Description>
  #   @param at [<Type>] <description>
  #   @return [<Type>] <description>
  included do
    has_many :comments

    def publish(at = Time.now)
    end
  end
  ```


Struct and Data classes assigned to constants are documented as classes, YARD reads types of their
members from `@attr` and `@attr_reader` tags. `class Point < Struct.new(:x, :y)` gets `@attr` tags too:

```ruby
#
# <Description>
#
# @attr x [<Type>] <description>
# @attr y [<Type>] <description>
#
Point = Struct.new(:x, :y)
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
"yard.tags.overload" // Document methods overloaded by rbs-inline annotations with @overload tags
"yard.tags.see" // Refer to methods of superclasses overridden by methods calling super with @see tags
"yard.tags.since" // Append @since tag to new documentation, prefilled with a version of a gem
"yard.tags.todo" // Document TODO, FIXME, XXX, HACK and OPTIMIZE notes written in method bodies with @todo tags
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
