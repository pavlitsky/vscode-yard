#
# Handle a request.
#
# @abstract Subclass to handle requests.
#
# @deprecated <description>
#
# @raise [NotImplementedError] <description>
#
# @return [Response] response to send
#
def call
  ActiveSupport::Deprecation.warn("call is deprecated")
  raise NotImplementedError
end
