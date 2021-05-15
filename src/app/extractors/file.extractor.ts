import { Injectable } from '@angular/core';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { FileUtil } from '../utils/file.util';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class FileChainExtractor extends BaseChainExtractor {

  constructor(private fileUtil: FileUtil) {
    super();
  }

  public async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    let rawData = await this.fileUtil.readFileAsync(chain.eventsPath);
    rawData = JSON.parse(rawData);
    if (Array.isArray(rawData)) {
      return Promise.resolve(rawData.map(e => EventModel.fromJS(e, chain)));
    }
    return Promise.resolve(undefined);
  }

}