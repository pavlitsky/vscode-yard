#
# <Description>
#
# @param [Hash] opts <description>
# @option opts [<Type>] :<key> <description>
# @option opts [<Type>] :<key> <description>
# @option opts [<Type>] :<key> <description>
#
# @return [<Type>] <description>
#
def foo(opts = {})
  def bar(opts)
    opts[:inner]
  end
end
