sig do
  params(names: String, options: Integer, blk: T.nilable(T.proc.params(name: String).void)).void
end
def each_name(*names, **options, &blk)
end
