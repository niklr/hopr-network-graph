import { Injectable } from '@angular/core';
import { TheGraphClient } from '../clients/thegraph.client';
import { ChainType } from '../enums/chain.enum';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { Logger } from '../services/logger.service';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class GraphqlChainExtractor extends BaseChainExtractor {

  constructor(protected logger: Logger, private client: TheGraphClient) {
    super(logger);
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    this.logger.info(`GraphQL extraction of ${ChainType[chain.type]} started.`);
    return new Promise((resolve, reject) => {
      this.client.test(chain.theGraphUrl).subscribe(result => {
        resolve([]);
      }, error => {
        reject(error);
      });
    });
  }

}
