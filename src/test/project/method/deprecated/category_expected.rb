#
# <Description>
#
# @deprecated <description>
#
# @param [<Type>] url <description>
#
# @return [<Type>] <description>
#
def old_fetch(url)
  Kernel.warn("Use fetch instead", uplevel: 1, category: :deprecated) if $VERBOSE
  fetch(url)
end
