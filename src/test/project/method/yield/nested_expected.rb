#
# <Description>
#
# @param bar [<Type>] <description>
#
# @yield [item, bar] <description>
# @yieldparam item [<Type>] <description>
# @yieldparam bar [<Type>] <description>
# @yieldreturn [<Type>] <description>
#
# @return [<Type>] <description>
#
def foo(bar)
  if bar
    [1, 2].each do |item|
      yield item, bar
    end
  end
rescue StandardError
  yield nil
end
