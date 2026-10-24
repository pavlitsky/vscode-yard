#
# <Description>
#
# @overload each
#   @yield [item] <description>
#   @yieldparam [Integer] item <description>
#   @yieldreturn [void] <description>
#   @return [self] <description>
# @overload each
#   @return [Enumerator<Integer, self>] <description>
#
#: () { (Integer item) -> void } -> self
#: () -> Enumerator[Integer, self]
def each
  return enum_for(:each) unless block_given?
  @items.each { |item| yield item }
end
