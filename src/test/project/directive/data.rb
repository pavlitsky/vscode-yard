Geo::Point = Data.define(:lat, :lng) do
  def to_s = "#{lat}, #{lng}"
end
