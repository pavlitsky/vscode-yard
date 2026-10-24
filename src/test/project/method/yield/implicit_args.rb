def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
