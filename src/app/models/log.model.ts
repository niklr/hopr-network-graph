export class LogEventModel {
  banner: string;
  args: any[];

  public constructor(init?: Partial<LogEventModel>) {
    Object.assign(this, init);
  }
}
