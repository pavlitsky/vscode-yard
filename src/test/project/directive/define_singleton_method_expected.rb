# @!method self.valid?(value)
#   <Description>
#   @param [<Type>] value <description>
#   @return [Boolean] <description>
define_singleton_method(:valid?, ->(value) { value.positive? })
