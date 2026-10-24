def old_fetch(url)
  MyGem.deprecator.warn("old_fetch is going away")
  fetch(url)
end
