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
def each_pair(prefix,
              &block)
  @items.each { |key, value| block.(key, value) }
end
