#
# <Description>
#
# @overload fetch(key)
#   @param [Symbol] key <description>
#   @return [String] <description>
# @overload fetch(key, default = "none")
#   @param [Symbol] key <description>
#   @param [String] default <description>
#   @return [String] <description>
#
#: (Symbol key) -> String
#: (Symbol key, ?String default) -> String
def fetch(key, default = "none")
end
