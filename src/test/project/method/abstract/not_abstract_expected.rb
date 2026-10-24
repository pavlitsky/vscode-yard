#
# <Description>
#
# @param [<Type>] request <description>
#
# @raise [NotImplementedError] <description>
#
# @return [<Type>] <description>
#
def call(request)
  raise NotImplementedError unless request.supported?
  handle(request)
end
