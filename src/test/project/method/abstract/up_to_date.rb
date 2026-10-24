#
# Handle a request.
#
# @param [Request] request incoming request
#
# @return [Response] response to send
#
# @abstract Subclass and override to handle requests.
#
def call(request)
  raise NotImplementedError
end
