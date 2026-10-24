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
  yield bar
  yield bar, baz
end
