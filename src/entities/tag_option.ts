// A single option. Used for a options hash parameters.
export class TagOption {
  public paramName: string;
  public key: string;
  public types: string;
  // Placeholder of unknown types, '<Type>' if empty
  public typesPlaceholder: string;
  public defaultValue: string;
  public text: string;
  public type: string;

  constructor(params: Partial<TagOption> = {}) {
    const {
      paramName = "",
      key = "",
      types = "",
      typesPlaceholder = "",
      defaultValue = "",
      text = "",
      type = "TagOption",
    } = params;

    this.paramName = paramName;
    this.key = key;
    this.types = types;
    this.typesPlaceholder = typesPlaceholder;
    this.defaultValue = defaultValue;
    this.text = text;
    this.type = type;
  }
}
