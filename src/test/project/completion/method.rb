# Fetch a resource.
#
# @param [String] url resource path
# @
def fetch(url, retries = 3, opts = { timeout: 5 })
  raise ArgumentError, "bad url" unless url
  raise "failed" if retries.zero?
  yield response
end
