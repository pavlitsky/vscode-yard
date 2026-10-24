# Convert a value.
#
# @overload convert(value)
#   @param [Integer] value <description>
#   @return [String] <description>
# @overload convert(value)
#   @param [String] value <description>
#   @return [Integer] <description>
#
# @raise [ArgumentError] <description>
#
# @rbs (Integer) -> String
#    | (String) -> Integer
def convert(value)
  raise ArgumentError unless value
end
