sig { params(prefix: String, blk: T.proc.params(key: Symbol, value: Integer).returns(T::Boolean)).returns(T::Array[Symbol]) }
def select_keys(prefix, &blk)
  @items.select { |key, value| blk.call(key, value) }
end
