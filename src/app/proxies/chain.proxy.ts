import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ChainTxEventType } from '../enums/chain.enum';
import { ConfigChainModel } from '../models/config.model';
import { CommonUtil } from '../utils/common.util';

@Injectable({
  providedIn: 'root'
})
export class ChainProxy {

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

  public async getAllEventsByTypeAsync(
    chain: ConfigChainModel, contract: ethers.Contract, type: ChainTxEventType): Promise<ethers.Event[]> {
    return null;
  }

  public async getAllTransfersAsync(contract: ethers.Contract): Promise<ethers.Event[]> {
    const blockNumber = await this.getBlockNumberAsync(contract.provider);
    const transfers = await this.getTransfersByBlockAsync(contract, 0, blockNumber);
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

  public async loadRawData(chain: ConfigChainModel): Promise<any> {
    const provider = this.createEthersProvider(chain.rpcProviderUrl);
    const contract = new ethers.Contract(chain.tokenContractAddress, chain.tokenContractAbi, provider);
    contract.name().then((res: any) => {
      console.log('name: ', res);
    });
    const events = [];
    events.concat(await this.getAllEventsByTypeAsync(chain, contract, ChainTxEventType.MINT));
    return events;
    // return await this.getAllTransfersAsync(contract);
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
