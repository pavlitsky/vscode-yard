#
# <Description>
#
# @yield <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def foo
  return enum_for(:foo) unless block_given?
  bar
end
