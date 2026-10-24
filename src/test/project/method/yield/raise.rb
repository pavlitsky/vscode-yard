def each_item
  raise StopIteration if @items.empty?
  @items.each { |item| yield item }
end
