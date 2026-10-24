def old_fetch(url)
  Kernel.warn("Use fetch instead", uplevel: 1, category: :deprecated) if $VERBOSE
  fetch(url)
end
