#
# <Description>
#
# @yield <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def on_change(&block)
  @callback = block
end
