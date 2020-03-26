// A single option. Used for a options hash parameters.
export class TagOption {
  public paramName?: string;
  public key?: string;
  public types?: string;
  public defaultValue?: string;
  public text?: string;
  public type?: string;

  constructor(params: TagOption = {} as TagOption) {
    const {
      paramName = "",
      key = "",
      types = "",
      defaultValue = "",
      text = "",
    } = params;

    this.paramName = paramName;
    this.key = key;
    this.types = types;
    this.defaultValue = defaultValue;
    this.text = text;
  }
}
