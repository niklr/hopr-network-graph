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
    switch (data.type) {
      case ChainTxEventType.TRANSFER:
        return TransferEventModel.fromJS(data);
      case ChainTxEventType.BRIDGE_START:
        return TokensBridgingInitiatedEventModel.fromJS(data);
      case ChainTxEventType.BRIDGE_END:
        return TokensBridgedEventModel.fromJS(data);
      default:
        break;
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
      throw new Error('Invalid TransferEvent arguments.');
    }
    return new TransferEventArgsModel({
      from: items[0],
      to: items[1],
      amount: CommonUtil.formatBigNumber(items[2])
    });
  }
}

export class TokensBridgingInitiatedEventModel extends EventModel {
  args: TokensBridgingInitiatedEventArgsModel;

  public constructor(init?: Partial<TokensBridgingInitiatedEventModel>) {
    super(init);
  }

  static fromJS(data: any): TokensBridgingInitiatedEventModel {
    data = typeof data === 'object' ? data : {};
    const result = new TokensBridgingInitiatedEventModel(data);
    result.args = TokensBridgingInitiatedEventArgsModel.fromJS(data?.args);
    return result;
  }
}

export class TokensBridgingInitiatedEventArgsModel {
  token: string;
  sender: string;
  value: string;
  messageId: string;

  public constructor(init?: Partial<TokensBridgingInitiatedEventArgsModel>) {
    Object.assign(this, init);
  }

  static fromJS(items: any): TokensBridgingInitiatedEventArgsModel {
    if (!Array.isArray(items) || items.length !== 4) {
      throw new Error('Invalid TokensBridgingInitiatedEvent arguments.');
    }
    return new TokensBridgingInitiatedEventArgsModel({
      token: items[0],
      sender: items[1],
      value: items[2],
      messageId: items[3]
    });
  }
}

export class TokensBridgedEventModel extends EventModel {
  args: TokensBridgedEventArgsModel;

  public constructor(init?: Partial<TokensBridgedEventModel>) {
    super(init);
  }

  static fromJS(data: any): TokensBridgedEventModel {
    data = typeof data === 'object' ? data : {};
    const result = new TokensBridgedEventModel(data);
    result.args = TokensBridgedEventArgsModel.fromJS(data?.args);
    return result;
  }
}

export class TokensBridgedEventArgsModel {
  token: string;
  recipient: string;
  value: string;
  messageId: string;

  public constructor(init?: Partial<TokensBridgedEventArgsModel>) {
    Object.assign(this, init);
  }

  static fromJS(items: any): TokensBridgedEventArgsModel {
    if (!Array.isArray(items) || items.length !== 4) {
      throw new Error('Invalid TokensBridgedEvent arguments.');
    }
    return new TokensBridgedEventArgsModel({
      token: items[0],
      recipient: items[1],
      value: items[2],
      messageId: items[3]
    });
  }
}
