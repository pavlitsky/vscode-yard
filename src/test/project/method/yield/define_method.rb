define_method(:each_item) do |&block|
  @items.each { |item| block.call(item) }
end
