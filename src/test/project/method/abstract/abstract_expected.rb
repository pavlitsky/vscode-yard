#
# <Description>
#
# @abstract <description>
#
# @param [<Type>] request <description>
#
# @return [<Type>] <description>
#
def call(request)
  raise NotImplementedError, "#{self.class} must implement #{__method__}"
end
