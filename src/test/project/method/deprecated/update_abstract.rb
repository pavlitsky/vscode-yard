#
# Handle a request.
#
# @abstract Subclass to handle requests.
#
# @return [Response] response to send
#
def call
  ActiveSupport::Deprecation.warn("call is deprecated")
  raise NotImplementedError
end
