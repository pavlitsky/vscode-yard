# @!attribute [rw] author
#   <Description>
#   @return [User, nil] <description>
belongs_to :author, class_name: "User", optional: true
