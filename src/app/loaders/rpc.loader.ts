import { Injectable } from '@angular/core';
import { EthersClient } from '../clients/ethers.client';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { BaseChainLoader } from './base.loader';

@Injectable({
  providedIn: 'root'
})
export class RpcChainLoader extends BaseChainLoader {

  constructor(private client: EthersClient) {
    super();
  }

  protected async loadAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    throw new Error('Not implemented.');
  }

}
