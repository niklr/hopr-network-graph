import { Injectable } from '@angular/core';
import { TheGraphClient } from '../clients/thegraph.client';
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

  protected get name(): string {
    return 'GraphQL';
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    return new Promise((resolve, reject) => {
      this.client.getTransactions(chain.theGraphUrl, 10).subscribe(result => {
        console.log(result);
        resolve([]);
      }, error => {
        reject(error);
      });
    });
  }

}
