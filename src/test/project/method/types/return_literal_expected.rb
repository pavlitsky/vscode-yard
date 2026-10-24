#
# <Description>
#
# @return [Symbol, String] <description>
#
def status
  return :missing unless @found
  "ok"
end
