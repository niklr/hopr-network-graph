import { Injectable } from '@angular/core';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class GraphqlChainExtractor extends BaseChainExtractor {

  constructor() {
    super();
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    throw new Error('Not implemented.');
  }

}
