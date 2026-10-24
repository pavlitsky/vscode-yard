#
# <Description>
#
# @param prefix [String] <description>
#
# @yield [key, value] <description>
# @yieldparam key [Symbol] <description>
# @yieldparam value [Integer] <description>
# @yieldreturn [void] <description>
#
# @return [void] <description>
#
#: (String prefix) { (Symbol key, Integer value) -> void } -> void
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
