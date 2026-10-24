# @!method self.active
#   <Description>
#   @return [ActiveRecord::Relation] <description>
scope :active, lambda { where(active: true) }
