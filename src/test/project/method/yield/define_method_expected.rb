# @!method each_item(&block)
#   <Description>
#   @yield [item] <description>
#   @yieldparam item [<Type>] <description>
#   @yieldreturn [<Type>] <description>
#   @return [<Type>] <description>
define_method(:each_item) do |&block|
  @items.each { |item| block.call(item) }
end
