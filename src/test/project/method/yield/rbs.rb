#: (String prefix) { (Symbol key, Integer value) -> void } -> void
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
