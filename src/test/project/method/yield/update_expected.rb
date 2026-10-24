# Iterate.
#
# @param prefix [String] key prefix
#
# @yield [key, value] <description>
# @yieldparam key [<Type>] <description>
# @yieldparam value [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [void]
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
