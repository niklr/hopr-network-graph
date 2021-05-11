import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { ConfigChainModel } from '../models/config.model';
import { CommonUtil } from '../utils/common.util';
import { FileUtil } from '../utils/file.util';

@Injectable({
  providedIn: 'root'
})
export class ChainProxy {

  constructor(private fileUtil: FileUtil) {

  }

  public createEthersProvider(url: string): ethers.providers.Provider {
    if (CommonUtil.isNullOrWhitespace(url)) {
      return null;
    }
    return new ethers.providers.JsonRpcProvider(url);
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

  public async getAllEvents(chain: ConfigChainModel): Promise<any> {
    let events = [];
    events = events.concat(await this.getTokenEvents(chain));
    events = events.concat(await this.getBridgeEvents(chain));
    return events;
  }

  public async getTokenEvents(chain: ConfigChainModel): Promise<any> {
    const provider = this.createEthersProvider(chain.rpcProviderUrl);
    const blockNumber = await this.getBlockNumberAsync(provider);
    const abi = await this.fileUtil.readFileAsync(chain.tokenContractAbiPath);
    const contract = new ethers.Contract(chain.tokenContractAddress, JSON.parse(abi), provider);
    console.log(chain.tokenContractAddress, await contract.name());
    let events = [];
    for (const eventType of [ChainTxEventType.MINT, ChainTxEventType.TRANSFER, ChainTxEventType.BURN]) {
      events = events.concat(await this.getEventsByTypeAsync(chain, contract, eventType, blockNumber));
    }
    return events;
  }

  public async getBridgeEvents(chain: ConfigChainModel): Promise<any> {
    const provider = this.createEthersProvider(chain.rpcProviderUrl);
    const blockNumber = await this.getBlockNumberAsync(provider);
    const abi = await this.fileUtil.readFileAsync(chain.bridgeContractAbiPath);
    const contract = new ethers.Contract(chain.bridgeContractAddress, JSON.parse(abi), provider);
    console.log(chain.bridgeContractAddress);
    let events = [];
    for (const eventType of [ChainTxEventType.BRIDGE_START, ChainTxEventType.BRIDGE_END]) {
      events = events.concat(await this.getEventsByTypeAsync(chain, contract, eventType, blockNumber));
    }
    return events;
  }

  public async getEventsByTypeAsync(
    chain: ConfigChainModel,
    contract: ethers.Contract,
    type: ChainTxEventType,
    blockNumber: number
  ): Promise<ethers.Event[]> {
    const chainName = ChainType[chain.type];
    const eventName = this.getTxEventName(chain, type);
    console.log(`Extract ${eventName} events of ${chainName} started.`);
    // Create a filter e.g. contract.filters.Transfer() if the eventName is equal to Transfer
    let filter: ethers.EventFilter;
    switch (type) {
      case ChainTxEventType.BRIDGE_START:
      case ChainTxEventType.BRIDGE_END:
        // Filter by token smart contract address
        // - TokensBridged(address indexed token, address indexed recipient, uint256 value, bytes32 indexed messageId)
        // - TokensBridgingInitiated(index_topic_1 address token, index_topic_2 address sender, ...)
        filter = contract.filters[eventName](chain.tokenContractAddress);
        break;
      default:
        filter = contract.filters[eventName]();
        break;
    }
    const events = await this.getEventsByBlockAsync(contract, filter, chain.startBlock, blockNumber);
    console.log(`Extract ${eventName} events of ${chainName} ended.`);
    return events;
  }

  public async getEventsByBlockAsync(
    contract: ethers.Contract, filter: ethers.EventFilter, fromBlock: number, toBlock: number
  ): Promise<ethers.Event[]> {
    if (fromBlock <= toBlock) {
      try {
        return await contract.queryFilter(filter, fromBlock, toBlock);
      }
      catch (error) {
        // tslint:disable-next-line: no-bitwise
        const midBlock = (fromBlock + toBlock) >> 1;
        console.log('getEventsByBlockAsync midBlock', midBlock);
        const arr1 = await this.getEventsByBlockAsync(contract, filter, fromBlock, midBlock);
        const arr2 = await this.getEventsByBlockAsync(contract, filter, midBlock + 1, toBlock);
        return [...arr1, ...arr2];
      }
    }
    return [];
  }

  public getTxEventName(chain: ConfigChainModel, type: ChainTxEventType): string {
    const typeName = ChainTxEventType[type];
    if (chain?.txEventNames && chain.txEventNames.hasOwnProperty(typeName)) {
      return chain.txEventNames[typeName];
    }
    return undefined;
  }

  public async test(contract: ethers.Contract): Promise<void> {
    const filter = contract.filters.Burn();
    const events = await contract.queryFilter(filter);
    console.log('test', events);
    if (events && events.length > 0) {
      const test = events[0];
      console.log(test.decode(test.data, test.topics));
    }
  }
}
