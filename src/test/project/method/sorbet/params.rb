sig { params(url: String, retries: T.nilable(Integer), format: Symbol).returns(T::Boolean) }
def fetch(url, retries = nil, format: :json)
end
