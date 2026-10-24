def connect(host, **options)
  port = options.fetch(:port, 443)
  ssl = options.key?(:ssl)
end
