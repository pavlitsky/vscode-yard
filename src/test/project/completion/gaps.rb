# @param [Hash] opts options
# @yield [key] block
# @yieldparam [String] key the key
# @return [void]
# @raise [KeyError] when missing
# @
def each_pair(opts = { timeout: 5 })
  raise KeyError unless opts
  yield key, value
end
