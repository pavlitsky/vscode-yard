class Admin < User
  class << self
    # @!method find(id)
    #   <Description>
    #   @param [<Type>] id <description>
    #   @return [<Type>] <description>
    #   @see User.find
    define_method(:find) { |id| super(id) }
  end
end
