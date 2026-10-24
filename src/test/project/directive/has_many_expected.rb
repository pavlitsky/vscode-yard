# @!attribute [rw] blog_categories
#   <Description>
#   @return [ActiveRecord::Associations::CollectionProxy<BlogCategory>] <description>
has_many :blog_categories, dependent: :destroy
