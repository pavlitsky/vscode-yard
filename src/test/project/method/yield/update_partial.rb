# @yield [key] block
# @yieldparam key [String] the key
# @return [void]
def each_pair
  yield key, value
end
