class Admin < User
  class << self
    define_method(:find) { |id| super(id) }
  end
end
