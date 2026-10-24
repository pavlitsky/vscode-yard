#
# <Description>
#
# @param [Hash] opts <description>
# @option opts [<Type>] :a <description>
# @option opts [Integer] :b (1) <description>
# @option opts [<Type>] :c <description>
# @option opts [Integer] :d (2) <description>
# @option opts [Integer] :e (3) <description>
# @option opts [<Type>] :f <description>
#
# @return [<Type>] <description>
#
def foo(opts = {})
  a = opts[:a]
  b = opts.fetch(:b, 1)
  c = opts.key?(:c)
  d = opts[:d] || 2
  opts[:e] ||= 3
  opts.dig(:f, :g)
end
