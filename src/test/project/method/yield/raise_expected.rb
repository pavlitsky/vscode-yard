#
# <Description>
#
# @yield [item] <description>
# @yieldparam item [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @raise [StopIteration] <description>
#
# @return [<Type>] <description>
#
def each_item
  raise StopIteration if @items.empty?
  @items.each { |item| yield item }
end
