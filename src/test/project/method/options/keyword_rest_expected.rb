#
# <Description>
#
# @param [<Type>] host <description>
# @param [<Type>] **options <description>
# @option options [<Type>] :port (443) <description>
# @option options [<Type>] :ssl <description>
#
# @return [<Type>] <description>
#
def connect(host, **options)
  port = options.fetch(:port, 443)
  ssl = options.key?(:ssl)
end
