#
# <Description>
#
# @param times [<Type>] <description>
#
# @yield [attempt] <description>
# @yieldparam attempt [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def with_retries(times, &block)
  times.times { |attempt| block.call(attempt) }
end
