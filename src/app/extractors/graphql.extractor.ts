import { Injectable } from '@angular/core';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { Logger } from '../services/logger.service';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class GraphqlChainExtractor extends BaseChainExtractor {

  constructor(protected logger: Logger) {
    super(logger);
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    throw new Error('Not implemented.');
  }

}
