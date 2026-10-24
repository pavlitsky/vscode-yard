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
  warn "[DEPRECATION] #{__method__} is deprecated, use fetch instead"
  fetch(url)
end
