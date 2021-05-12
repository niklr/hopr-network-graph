import { Injectable } from '@angular/core';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { FileUtil } from '../utils/file.util';
import { BaseChainLoader } from './base.loader';

@Injectable({
  providedIn: 'root'
})
export class FileChainLoader extends BaseChainLoader {

  constructor(private fileUtil: FileUtil) {
    super();
  }

  public async loadAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    let rawData = await this.fileUtil.readFileAsync(chain.eventsPath);
    rawData = JSON.parse(rawData);
    if (Array.isArray(rawData)) {
      return Promise.resolve(rawData.map(e => EventModel.fromJS(e)));
    }
    return Promise.resolve(undefined);
  }

}