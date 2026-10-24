def call(request)
  raise NotImplementedError, "#{self.class} must implement #{__method__}"
end
