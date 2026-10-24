# <Description>
# @param prefix [<Type>] <description>
# @yield [key, value] <description>
# @yieldparam key [<Type>] <description>
# @yieldparam value [<Type>] <description>
# @yieldreturn [<Type>] <description>
# @return [<Type>] <description>
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
