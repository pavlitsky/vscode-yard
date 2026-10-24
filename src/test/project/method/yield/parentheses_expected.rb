#
# <Description>
#
# @yield [bar, baz] <description>
# @yieldparam bar [<Type>] <description>
# @yieldparam baz [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def foo
  result = yield(bar, baz)
  result
end
