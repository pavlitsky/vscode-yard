# Connect.
#
# @param [String] host host address
# @param [Hash] options connection options
# @option options [Integer] :port (443) port number
# @option options [<Type>] :ssl <description>
#
# @return [Connection] connection
def connect(host, options = {})
  options.fetch(:port, 443)
  options[:ssl]
end
