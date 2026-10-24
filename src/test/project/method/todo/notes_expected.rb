#
# <Description>
#
# @param [<Type>] url <description>
#
# @return [<Type>] <description>
#
# @todo retry on timeout
# @todo handle redirects
# @todo <description>
#
def fetch(url)
  # TODO: retry on timeout
  response = get(url) # FIXME handle redirects
  # todo lowercase isn't a note
  # TODO
  response
end
