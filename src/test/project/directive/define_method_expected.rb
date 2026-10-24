# @!method greet(name, greeting = "Hello", *rest, loud: false, &block)
#   <Description>
#   @param [<Type>] name <description>
#   @param [String] greeting <description>
#   @param [Array<Object>] rest <description>
#   @param [Boolean] loud <description>
#   @param [Proc] block <description>
#   @return [String] <description>
define_method(:greet) do |name, greeting = "Hello", *rest, loud: false, &block|
  "#{greeting}, #{name}"
end
