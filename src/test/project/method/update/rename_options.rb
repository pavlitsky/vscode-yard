# Connect.
#
# @param [String] address host address
# @param [Hash] opts connection options
# @option opts [Integer] :port (443) port number
#
# @return [Connection] connection
def connect(host, options = {})
  options.fetch(:port, 443)
  options[:ssl]
end
