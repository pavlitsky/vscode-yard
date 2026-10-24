class Admin < User
  # Save the admin.
  #
  # @return [Boolean] saved or not
  # @see Audit
  def save
    super
  end
end
