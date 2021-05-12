import { ChainType } from '../enums/chain.enum';

export class StatModel {
  _id: string;
  version: string;
  extractedDate: Date;
  extractSuccess: boolean;
  source: string;
  lastBlock: number;

  public constructor(init?: Partial<StatModel>) {
    Object.assign(this, init);
    if (!this.extractedDate) {
      this.extractedDate = new Date();
    }
  }
}

export class ChainStatModel extends StatModel {
  type: ChainType;

  public constructor(init?: Partial<StatModel>) {
    super(init);
  }
}
