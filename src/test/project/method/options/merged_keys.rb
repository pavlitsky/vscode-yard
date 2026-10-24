def foo(opts = { timeout: 5, retries: 3 })
  opts.fetch(:timeout, 10)
  opts.fetch(:retries, 3)
  opts[:verbose]
  opts[:verbose]
end
