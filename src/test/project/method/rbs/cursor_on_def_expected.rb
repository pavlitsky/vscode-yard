#
# <Description>
#
# @param [String] url <description>
# @param [Integer] retries <description>
# @param [Array<Symbol>] tags <description>
# @param [Float] timeout <description>
# @param [Hash{Symbol => Object}] opts <description>
#
# @return [Boolean] <description>
#
#: (String url, ?Integer retries, *Symbol tags, timeout: Float, **untyped opts) -> bool
def fetch(url, retries = 3, *tags, timeout:, **opts)
end
