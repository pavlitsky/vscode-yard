#
# <Description>
#
# @overload find(id)
#   @param [Integer] id <description>
#   @return [User] <description>
# @overload find(*args)
#   @param [Array<String>] args <description>
#   @return [Array<User>] <description>
# @overload find(<name>, limit = <default>)
#   @param [Symbol] <name> <description>
#   @param [Integer] limit <description>
#   @return [User, nil] <description>
#
#: (Integer id) -> User
#: (*String names) -> Array[User]
#: (Symbol, ?Integer limit) -> User?
def find(*args)
end
