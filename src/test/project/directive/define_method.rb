define_method(:greet) do |name, greeting = "Hello", *rest, loud: false, &block|
  "#{greeting}, #{name}"
end
