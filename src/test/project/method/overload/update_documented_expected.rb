# Convert a value.
#
# @overload convert(value)
#   @param [Integer] value a number
#   @return [String] the number written
#
# @raise [ArgumentError] <description>
#
#: (Integer) -> String
#: (String) -> Integer
def convert(value)
  raise ArgumentError unless value
end
