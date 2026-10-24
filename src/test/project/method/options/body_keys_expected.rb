#
# <Description>
#
# @param [<Type>] opts <description>
# @option opts [<Type>] :a <description>
# @option opts [<Type>] :b (1) <description>
# @option opts [<Type>] :c <description>
# @option opts [<Type>] :d (2) <description>
# @option opts [<Type>] :e (3) <description>
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
