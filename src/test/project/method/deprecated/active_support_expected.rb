#
# <Description>
#
# @deprecated <description>
#
# @param [<Type>] url <description>
#
# @raise [ArgumentError] <description>
#
# @return [<Type>] <description>
#
def old_fetch(url)
  ActiveSupport::Deprecation.warn("Use fetch instead")
  raise ArgumentError unless url
  fetch(url)
end
