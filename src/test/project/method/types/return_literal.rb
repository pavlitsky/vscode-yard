def status
  return :missing unless @found
  "ok"
end
