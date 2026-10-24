#: () { (Integer item) -> void } -> self
#: () -> Enumerator[Integer, self]
def each
  return enum_for(:each) unless block_given?
  @items.each { |item| yield item }
end
