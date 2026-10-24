#
# Fetch a resource.
#
# @deprecated <description>
#
# @param [String] url resource path
#
# @return [String] response body
#
def old_fetch(url)
  warn "old_fetch is deprecated"
  fetch(url)
end
