#
# <Description>
#
# @overload request(url, timeout: 5)
#   @param [String] url <description>
#   @param [Integer] timeout <description>
#   @return [Response] <description>
# @overload request(url, **opts)
#   @param [URI] url <description>
#   @param [Hash{Symbol => Object}] opts <description>
#   @option opts [Integer] :retries (3) <description>
#   @return [Response] <description>
#
#: (String url, ?timeout: Integer) -> Response
#: (URI url, **untyped opts) -> Response
def request(url, timeout: 5, **opts)
  opts.fetch(:retries, 3)
end
