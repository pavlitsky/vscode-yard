# Iterate.
#
# @param prefix [String] key prefix
#
# @return [void]
def each_pair(prefix)
  @items.each { |key, value| yield key, value }
end
