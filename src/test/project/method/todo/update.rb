# Fetch a resource.
#
# @param [String] url resource path
# @return [String] body
# @todo retry on timeout
def fetch(url)
  # TODO: retry on timeout
  # XXX: cache responses
  get(url)
end
