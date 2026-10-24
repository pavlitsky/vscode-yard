class Admin < Base::User
  def name(format = :full)
    super.upcase
  end
end
