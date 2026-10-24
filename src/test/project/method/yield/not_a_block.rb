def foo
  bar # yield in a comment
  puts "do not yield"
  Fiber.yield baz
end

def qux
  yield
end
