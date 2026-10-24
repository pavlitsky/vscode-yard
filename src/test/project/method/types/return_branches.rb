def label
  if @ok
    "ok"
  elsif @warn
    :warn
  else
    raise LabelError
  end
end
