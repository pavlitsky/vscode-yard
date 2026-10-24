#
# <Description>
#
# @attr_reader [<Type>] lat <description>
# @attr_reader [<Type>] lng <description>
#
# @author <Name> <<email>>
#
Geo::Point = Data.define(:lat, :lng) do
  def to_s = "#{lat}, #{lng}"
end
