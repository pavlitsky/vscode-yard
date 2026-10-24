#
# <Description>
#
# @param [Hash] opts <description>
# @option opts [Integer] :sym (3) <description>
# @option opts [String] :long <description>
# @option opts [Array] :multi <description>
#
# @return [<Type>] <description>
#
def foo(opts = { "name" => 1, KEY => 2, :sym => 3 })
  opts.fetch(:long, "a very long default value exceeding the limit")
  opts.fetch(:multi, [
    1,
  ])
  other[:ignored]
end
