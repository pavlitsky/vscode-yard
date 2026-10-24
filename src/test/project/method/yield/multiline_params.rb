def each_pair(prefix,
              &block)
  @items.each { |key, value| block.(key, value) }
end
