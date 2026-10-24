#
# <Description>
#
# @param [Hash] opts <description>
# @option opts [Integer] :timeout <description>
# @option opts [Integer] :retries (3) <description>
# @option opts [<Type>] :verbose <description>
#
# @return [<Type>] <description>
#
def foo(opts = { timeout: 5, retries: 3 })
  opts.fetch(:timeout, 10)
  opts.fetch(:retries, 3)
  opts[:verbose]
  opts[:verbose]
end
