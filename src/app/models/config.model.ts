import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { GraphLibraryType } from '../enums/graph.enum';

export class ConfigModel {

  private _selectedChainType: ChainType;
  private _selectedChain: ChainConfigModel;

  isDevelopment: boolean;
  version: string;
  minWeight: number;
  chains: ChainConfigModel[];
  selectedGraphLibraryType: GraphLibraryType;

  public constructor(init?: Partial<ConfigModel>) {
    this.init(init);
  }

  static fromJS(data: any): ConfigModel {
    data = typeof data === 'object' ? data : {};
    const result = new ConfigModel();
    result.init(data);
    return result;
  }

  public init(data?: any): void {
    Object.assign(this, data);
    if (!this.chains) {
      this.chains = [];
    } else {
      this.chains = data?.chains?.map((e: any) => ChainConfigModel.fromJS(e)) ?? [];
    }
  }

  public get selectedChainType(): ChainType {
    return this._selectedChainType;
  }

  public set selectedChainType(value: ChainType) {
    this._selectedChainType = value;
    this.setSelectedChain(value);
  }

  public get selectedChain(): ChainConfigModel {
    if (this._selectedChain?.type !== this._selectedChainType) {
      this.setSelectedChain(this._selectedChainType);
    }
    return this._selectedChain;
  }

  public getChainByType(type: ChainType): ChainConfigModel {
    return this.chains?.find(e => e.type === type);
  }

  private setSelectedChain(value: ChainType): void {
    this._selectedChain = this.getChainByType(value);
  }
}

export class ChainConfigModel {

  private txEventSignaturesMap: Map<string, ChainTxEventType>;

  type: ChainType;
  rpcProviderUrl: string;
  startBlock: number;
  addressUrl: string;
  txUrl: string;
  tokenContractAbiPath: string;
  tokenContractAddress: string;
  bridgeContractAbiPath: string;
  bridgeContractAddress: string;
  txEventSignatures: { [key: string]: string };
  eventsPath: string;

  public constructor(init?: Partial<ChainConfigModel>) {
    this.init(init);
  }

  static fromJS(data: any): ChainConfigModel {
    data = typeof data === 'object' ? data : {};
    const result = new ChainConfigModel(data);
    return result;
  }

  public init(data?: any): void {
    Object.assign(this, data);
    if (!this.txEventSignatures) {
      this.txEventSignatures = {};
    }
    this.txEventSignaturesMap = new Map<string, ChainTxEventType>();
    for (const key of Object.keys(this.txEventSignatures)) {
      this.txEventSignaturesMap.set(this.txEventSignatures[key], ChainTxEventType[key]);
    }
  }

  public mapTxEventTypeToString(type: ChainTxEventType): string {
    const typeName = ChainTxEventType[type];
    if (this.txEventSignatures && this.txEventSignatures.hasOwnProperty(typeName)) {
      return this.txEventSignatures[typeName];
    }
    return undefined;
  }

  public mapTxEventSignatureToType(signature: string): ChainTxEventType {
    return this.txEventSignaturesMap.get(signature) ?? ChainTxEventType.UNKNOWN;
  }
}
