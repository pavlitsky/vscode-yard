def old_fetch(url)
  ActiveSupport::Deprecation.warn("Use fetch instead")
  raise ArgumentError unless url
  fetch(url)
end
