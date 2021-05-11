import { ChainTxEventType } from '../enums/chain.enum';
import { CommonUtil } from '../utils/common.util';

export abstract class EventModel {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
  logIndex: number;
  event: string;
  type: ChainTxEventType;
  eventSignature: string;

  public constructor(init?: Partial<EventModel>) {
    Object.assign(this, init);
  }
}

export class TransferEventModel extends EventModel {
  args: TransferEventArgsModel;

  public constructor(init?: Partial<TransferEventModel>) {
    super(init);

    if (init?.args) {
      this.args = TransferEventArgsModel.create(init?.args);
    }
  }
}

export class TransferEventArgsModel {
  from: string;
  to: string;
  amount: string;

  public constructor(init?: Partial<TransferEventArgsModel>) {
    Object.assign(this, init);
  }

  public static create(items: any): TransferEventArgsModel {
    if (!Array.isArray(items) || items.length !== 3) {
      throw new Error('Invalid transfer arguments.');
    }
    return new TransferEventArgsModel({
      from: items[0],
      to: items[1],
      amount: CommonUtil.formatBigNumber(items[2])
    });
  }
}
