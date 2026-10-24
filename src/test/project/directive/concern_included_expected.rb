# @!attribute [rw] comments
#   <Description>
#   @return [ActiveRecord::Associations::CollectionProxy<Comment>] <description>
# @!method self.recent
#   <Description>
#   @return [ActiveRecord::Relation] <description>
# @!attribute [rw] draft
#   <Description>
#   @return [<Type>] <description>
# @!method publish(at = Time.now)
#   <Description>
#   @param [<Type>] at <description>
#   @raise [ArgumentError] <description>
#   @return [nil] <description>
# @!method self.find_published
#   <Description>
#   @return [<Type>] <description>
included do
  has_many :comments
  scope :recent, -> { order(created_at: :desc) }
  attr_accessor :draft

  def publish(at = Time.now)
    raise ArgumentError unless at
  end

  def self.find_published
  end

  private

  def notify
  end
end
