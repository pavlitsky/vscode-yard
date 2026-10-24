def foo(bar)
  if bar
    [1, 2].each do |item|
      yield item, bar
    end
  end
rescue StandardError
  yield nil
end
