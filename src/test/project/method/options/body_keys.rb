def foo(opts = {})
  a = opts[:a]
  b = opts.fetch(:b, 1)
  c = opts.key?(:c)
  d = opts[:d] || 2
  opts[:e] ||= 3
  opts.dig(:f, :g)
end
