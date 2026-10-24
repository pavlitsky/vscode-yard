#
# <Description>
#
# @yield [<name>, <name>] <description>
# @yieldparam <name> [<Type>] <description>
# @yieldparam <name> [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def first_item
  yield @items.first, :first
end
