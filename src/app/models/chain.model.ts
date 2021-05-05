import { ChainType } from '../enums/chain.enum';

export class ChainModel {
  type: ChainType;
  name: string;

  public constructor(init?: Partial<ChainModel>) {
    Object.assign(this, init);
  }
}
