#
# <Description>
#
# @param [Array<String>] names <description>
# @param [Hash{Symbol => Integer}] options <description>
# @param [Proc, nil] blk <description>
#
# @return [void] <description>
#
sig do
  params(names: String, options: Integer, blk: T.nilable(T.proc.params(name: String).void)).void
end
def each_name(*names, **options, &blk)
end
