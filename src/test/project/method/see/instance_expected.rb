class Admin < Base::User
  #
  # <Description>
  #
  # @param [Symbol] format <description>
  #
  # @return [<Type>] <description>
  #
  # @see Base::User#name
  #
  def name(format = :full)
    super.upcase
  end
end
