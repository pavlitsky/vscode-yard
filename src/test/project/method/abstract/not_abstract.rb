def call(request)
  raise NotImplementedError unless request.supported?
  handle(request)
end
