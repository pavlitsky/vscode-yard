# @yield [key] block
# @yieldparam key [String] the key
# @yieldparam value [<Type>] <description>
# @yieldreturn [<Type>] <description>
# @return [void]
def each_pair
  yield key, value
end
