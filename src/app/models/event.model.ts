import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { CommonUtil } from '../utils/common.util';
import { IdUtil } from '../utils/id.util';
import { ChainConfigModel } from './config.model';

export class EventModel {
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
  eventSignature: string;
  type: ChainTxEventType;

  public constructor(init?: Partial<EventModel>) {
    this.init(init);
  }

  static fromJS(data: any, chain: ChainConfigModel): EventModel {
    data = typeof data === 'object' ? data : {};
    data.chainType = chain.type;
    data.type = chain.mapTxEventSignatureToType(data.eventSignature);
    if (data.type === ChainTxEventType.TRANSFER) {
      return TransferEventModel.fromJS(data);
    }
    return new EventModel(data);
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

  static fromJS(data: any): TransferEventModel {
    data = typeof data === 'object' ? data : {};
    const result = new TransferEventModel(data);
    result.args = TransferEventArgsModel.fromJS(data?.args);
    return result;
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
