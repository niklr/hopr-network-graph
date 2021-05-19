import { Injectable } from '@angular/core';
import { EthersClient } from '../clients/ethers.client';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { Logger } from '../services/logger.service';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class RpcChainExtractor extends BaseChainExtractor {

  constructor(protected logger: Logger, private client: EthersClient) {
    super(logger);
  }

  protected get name(): string {
    return 'RPC';
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    throw new Error('Not implemented.');
  }

}
