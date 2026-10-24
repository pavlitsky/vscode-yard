#
# <Description>
#
# @param [<Type>] url <description>
# @param [<Type>] retries <description>
#
# @raise [ArgumentError] <description>
# @raise [Net::ReadTimeout] <description>
# @raise [RuntimeError] <description>
# @raise [IndexError] <description>
#
# @return [<Type>] <description>
#
def fetch(url, retries = 3)
  raise ArgumentError, "bad url" unless url
  raise Net::ReadTimeout.new("timeout") if retries.zero?
  fail "failed: #{url}" if url.empty?
  raise ArgumentError, "again" if url.nil?
  [1].each { raise IndexError }
  def nested
    raise KeyError
  end
rescue IOError
  raise
end
