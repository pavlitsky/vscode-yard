def foo(opts = { "name" => 1, KEY => 2, :sym => 3 })
  opts.fetch(:long, "a very long default value exceeding the limit")
  opts.fetch(:multi, [
    1,
  ])
  other[:ignored]
end
