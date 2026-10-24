# @!method self.by_status(status)
#   <Description>
#   @param [<Type>] status <description>
#   @return [ActiveRecord::Relation] <description>
scope :by_status, ->(status) { where(status: status) }
