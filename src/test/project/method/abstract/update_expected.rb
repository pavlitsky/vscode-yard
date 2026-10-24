#
# Handle a request.
#
# @abstract <description>
#
# @param [Request] request incoming request
#
# @return [Response] response to send
#
def call(request)
  raise NotImplementedError
end
