class Admin < User
  # Save the admin.
  #
  # @return [Boolean] saved or not
  # @see Audit
  # @see User#save
  def save
    super
  end
end
