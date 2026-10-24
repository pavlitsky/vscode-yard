#
# <Description>
#
# @raise [LabelError] <description>
#
# @return [String, Symbol] <description>
#
def label
  if @ok
    "ok"
  elsif @warn
    :warn
  else
    raise LabelError
  end
end
