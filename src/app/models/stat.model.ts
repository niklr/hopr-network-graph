import { ChainType } from '../enums/chain.enum';

export class StatModel {
  _id: string;
  version: string;
  loadedDate: Date;
  loadSuccess: boolean;

  public constructor(init?: Partial<StatModel>) {
    Object.assign(this, init);
    if (!this.loadedDate) {
      this.loadedDate = new Date();
    }
  }
}

export class ChainStatModel extends StatModel {
  type: ChainType;

  public constructor(init?: Partial<StatModel>) {
    super(init);
  }
}
