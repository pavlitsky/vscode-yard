#
# <Description>
#
# @yield [item] <description>
# @yieldparam item [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def first_item
  yield @items.first
end
