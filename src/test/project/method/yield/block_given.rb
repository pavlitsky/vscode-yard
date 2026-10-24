def foo
  return enum_for(:foo) unless block_given?
  bar
end
