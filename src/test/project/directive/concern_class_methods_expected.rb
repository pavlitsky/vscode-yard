# @!method self.tagged?(name)
#   <Description>
#   @param [String] name <description>
#   @return [Boolean] <description>
# @!method self.tags
#   <Description>
#   @return [<Type>] <description>
class_methods do
  sig { params(name: String).returns(T::Boolean) }
  def tagged?(name)
  end

  def tags
  end
end
