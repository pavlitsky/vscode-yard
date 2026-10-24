def old_fetch(url)
  warn "[DEPRECATION] #{__method__} is deprecated, use fetch instead"
  fetch(url)
end
