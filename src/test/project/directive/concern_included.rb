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
