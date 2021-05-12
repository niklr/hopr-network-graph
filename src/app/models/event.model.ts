import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { CommonUtil } from '../utils/common.util';
import { IdUtil } from '../utils/id.util';

export abstract class EventModel {
  _id: string;
  chainType: ChainType;
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
    this.init(init);
  }

  static fromJS(data: any): EventModel {
    data = typeof data === 'object' ? data : {};
    if (data.type === ChainTxEventType.TRANSFER) {
      return new TransferEventModel(data);
    }
    throw new Error('The abstract class \'EventModel\' cannot be instantiated.');
  }

  public init(data?: any): void {
    Object.assign(this, data);
    if (!this._id) {
      this._id = IdUtil.create();
    }
  }
}

export class TransferEventModel extends EventModel {
  args: TransferEventArgsModel;

  public constructor(init?: Partial<TransferEventModel>) {
    super(init);
  }

  public init(data?: any): void {
    super.init(data);
    if (data?.args) {
      this.args = TransferEventArgsModel.fromJS(data?.args);
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

  static fromJS(items: any): TransferEventArgsModel {
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
