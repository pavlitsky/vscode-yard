#: (String url, ?timeout: Integer) -> Response
#: (URI url, **untyped opts) -> Response
def request(url, timeout: 5, **opts)
  opts.fetch(:retries, 3)
end
