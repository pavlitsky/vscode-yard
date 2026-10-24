def with_retries(times, &block)
  times.times { |attempt| block.call(attempt) }
end
