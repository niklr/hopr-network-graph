import { Injectable } from '@angular/core';
import { EthersClient } from '../clients/ethers.client';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class RpcChainExtractor extends BaseChainExtractor {

  constructor(private client: EthersClient) {
    super();
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    throw new Error('Not implemented.');
  }

}
