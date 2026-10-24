#
# Fetch a resource.
#
# @param [String] url <description>
# @param [Integer] retries <description>
#
# @return [String, nil] <description>
#
sig { params(url: String, retries: Integer).returns(T.nilable(String)) }
def fetch(url, retries)
end
