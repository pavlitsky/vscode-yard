#
# <Description>
#
# @param [String] url <description>
# @param [Integer, nil] retries <description>
# @param [Symbol] format <description>
#
# @return [Boolean] <description>
#
sig { params(url: String, retries: T.nilable(Integer), format: Symbol).returns(T::Boolean) }
def fetch(url, retries = nil, format: :json)
end
