#
# Fetch a resource.
#
# @param [String] url resource path
#
# @raise [ArgumentError, TypeError] if url is invalid
# @raise [IOError] if connection is lost
#
# @return [String] response body
#
def fetch(url)
  raise ArgumentError unless url
  raise Timeout::Error if slow?
  raise TypeError unless url.is_a?(String)
end
