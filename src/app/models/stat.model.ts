import { ChainType } from '../enums/chain.enum';

export class StatModel {
  _id: string;
  version: string;
  fetchedDate: Date;
  fetchSuccess: boolean;

  public constructor(init?: Partial<StatModel>) {
    Object.assign(this, init);
    if (!this.fetchedDate) {
      this.fetchedDate = new Date();
    }
  }
}

export class ChainStatModel extends StatModel {
  type: ChainType;

  public constructor(init?: Partial<StatModel>) {
    super(init);
  }
}
