def record
  return nil if @id.nil?
  Record.new(@id)
end
