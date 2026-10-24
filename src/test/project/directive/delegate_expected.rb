# @!method user_name
#   <Description>
#   @return [<Type>] <description>
# @!method user_email
#   <Description>
#   @return [<Type>] <description>
delegate :name, :email, to: :user, prefix: true, allow_nil: true
