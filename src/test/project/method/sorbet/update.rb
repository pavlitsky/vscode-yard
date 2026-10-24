#
# Fetch a resource.
#
sig { params(url: String, retries: Integer).returns(T.nilable(String)) }
def fetch(url, retries)
end
