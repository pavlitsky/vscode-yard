#
# <Description>
#
# @param [<Type>] url <description>
#
# @return [<Type>] <description>
#
def fetch(url)
  logger.warn("deprecated url format") if url.start_with?("http:")
  warn "slow request"
  def nested
    warn "nested is deprecated"
  end
end
