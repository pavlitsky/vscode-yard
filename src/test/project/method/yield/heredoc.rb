def foo
  puts <<~TEXT
    yield bar
  TEXT
end
