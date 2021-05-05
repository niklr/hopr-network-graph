import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { Subject } from 'rxjs';
import { ChainType } from '../enums/chain.enum';
import { ConfigChainModel } from '../models/config.model';
import {
  EdgeDataModel,
  EdgeGraphModel,
  GraphContainerModel,
  GraphScratchModel,
  NodeDataModel,
  NodeGraphModel
} from '../models/graph.model';
import { TransferModel } from '../models/transfer.model';
import { CommonUtil } from '../utils/common.util';
import { Ensure } from '../utils/ensure.util';
import { JsonUtil } from '../utils/json.util';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private _onDataChangeSubject: Subject<any>;

  constructor(private configService: ConfigService) {
    this._onDataChangeSubject = new Subject<any>();
  }

  public get onDataChangeSubject(): Subject<any> {
    return this._onDataChangeSubject;
  }

  public load(): void {
    this._onDataChangeSubject.next(undefined);
    this.loadAsync().finally();
  }

  public async loadAsync(): Promise<void> {
    let data: any[] = [];
    if (this.configService.config?.selectedChain) {
      data = await this.init(this.configService.config?.selectedChain);
    }
    this._onDataChangeSubject.next(data);
  }

  public async init(chain: ConfigChainModel): Promise<any> {
    Ensure.notNull(chain, ConfigChainModel.name);
    if (CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      const data = await JsonUtil.loadLocalAsync(chain.jsonPath);
      if (chain.type === ChainType.TEST) {
        return data;
      } else {
        return this.convertRawData(data);
      }
    } else {
      const provider = this.createEthersProvider(chain.rpcProviderUrl);
      const data = await this.loadRawData(chain, provider);
      return this.convertRawData(data);
    }
  }

  public async loadRawData(chain: ConfigChainModel, provider: ethers.providers.Provider): Promise<any> {
    const contract = new ethers.Contract(chain.tokenContractAddress, chain.tokenContractAbi, provider);
    contract.name().then((res: any) => {
      console.log('name: ', res);
    });
    await this.test(contract);
    return [];
    // return await this.getAllTransfersAsync(contract);
  }

  public async test(contract: ethers.Contract): Promise<void> {
    const filter = contract.filters.Burn();
    const events = await contract.queryFilter(filter);
    console.log('test', events);
    if (events && events.length > 0) {
      const asdf = events[0];
      console.log(asdf.decode(asdf.data, asdf.topics));
    }
  }

  public async getBlockNumberAsync(provider: ethers.providers.Provider): Promise<number> {
    const blockNumber = await provider.getBlockNumber();
    console.log('getBlockNumber', blockNumber);
    return blockNumber;
  }

  public async getSymbolAsync(contract: ethers.Contract): Promise<string> {
    const symbol = await contract.symbol();
    console.log('symbol', symbol);
    return symbol;
  }

  public async getBalanceAsync(contract: ethers.Contract, address: string): Promise<string> {
    const balance = await contract.balanceOf(address);
    const balanceFormatted = ethers.utils.formatUnits(balance, 18);
    console.log('balance', balanceFormatted);
    return balanceFormatted;
  }

  public async getAllTransfersAsync(contract: ethers.Contract): Promise<ethers.Event[]> {
    const blockNumber = await this.getBlockNumberAsync(contract.provider);
    const transfers = await this.getTransfersByBlockAsync(contract, 0, blockNumber);
    // JsonUtil.download(transfers);
    return transfers;
  }

  public async getTransfersByBlockAsync(contract: ethers.Contract, fromBlock: number, toBlock: number): Promise<ethers.Event[]> {
    const filter = contract.filters.Transfer();
    if (fromBlock <= toBlock) {
      try {
        return await contract.queryFilter(filter, fromBlock, toBlock);
      }
      catch (error) {
        // tslint:disable-next-line: no-bitwise
        const midBlock = (fromBlock + toBlock) >> 1;
        console.log('getTransfers midBlock', midBlock);
        const arr1 = await this.getTransfersByBlockAsync(contract, fromBlock, midBlock);
        const arr2 = await this.getTransfersByBlockAsync(contract, midBlock + 1, toBlock);
        return [...arr1, ...arr2];
      }
    }
    return [];
  }

  public async getTransfersByAddressAsync(contract: ethers.Contract, from: string, to: string): Promise<ethers.Event[]> {
    const filter = contract.filters.Transfer(from, to);
    return await contract.queryFilter(filter);
  }

  private createEthersProvider(url: string): ethers.providers.Provider {
    if (CommonUtil.isNullOrWhitespace(url)) {
      return null;
    }
    return new ethers.providers.JsonRpcProvider(url);
  }

  private convertRawData(rawData: any): any {
    const data = {
      nodes: [],
      edges: []
    };
    const nodeMap = new Map<string, NodeGraphModel>();
    if (rawData && Array.isArray(rawData)) {
      for (const element of rawData) {
        this.addGraphElements(new TransferModel(element), nodeMap, data);
      }
    }
    this.filterByWeight(data, nodeMap, this.configService.config.minWeight);
    // data.edges.length = 1000;
    // return [];
    return data;
  }

  private addGraphElements(transfer: TransferModel, nodeMap: Map<string, NodeGraphModel>, data: GraphContainerModel): void {
    this.tryAddNode(transfer.args.from, nodeMap, data);
    this.tryAddNode(transfer.args.to, nodeMap, data);
    data.edges.push(this.createEdgeModel(transfer));
  }

  private tryAddNode(address: string, nodeMap: Map<string, NodeGraphModel>, data: GraphContainerModel): void {
    if (nodeMap.has(address)) {
      const node = nodeMap.get(address);
      node.data.weight = Math.min(++node.data.weight, 100);
    } else {
      const node = this.createNodeModel(address);
      nodeMap.set(address, node);
      data.nodes.push(node);
    }
  }

  private filterByWeight(data: GraphContainerModel, nodeMap: Map<string, NodeGraphModel>, minWeight: number): void {
    console.log('nodes/edges before filterByWeight', data.nodes.length, '/', data.edges.length);
    data.nodes = data.nodes.filter(
      (e: any) => nodeMap.get(e.data.id).data.weight > minWeight);
    data.edges = data.edges.filter(
      (e: any) => nodeMap.get(e.data.source).data.weight > minWeight && nodeMap.get(e.data.target).data.weight > minWeight);
    console.log('nodes/edges after filterByWeight', data.nodes.length, '/', data.edges.length);
  }

  private createNode(address: string): any {
    return {
      group: 'nodes',
      data: {
        id: address,
        name: address.substring(0, 4),
        weight: 1
      }
    };
  }

  private createNodeModel(address: string): NodeGraphModel {
    return new NodeGraphModel({
      data: new NodeDataModel({
        id: address,
        name: address.substring(0, 4)
      })
    });
  }

  private createEdge(transfer: TransferModel): any {
    return {
      group: 'edges',
      data: {
        source: transfer.args.from,
        target: transfer.args.to,
        strength: 1
      }
    };
  }

  private createEdgeModel(transfer: TransferModel): EdgeGraphModel {
    return new EdgeGraphModel({
      data: new EdgeDataModel({
        source: transfer.args.from,
        target: transfer.args.to
      }),
      scratch: new GraphScratchModel({
        transfer
      })
    });
  }
}
