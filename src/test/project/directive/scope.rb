scope :by_status, ->(status) { where(status: status) }
