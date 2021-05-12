import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { ChainType } from '../enums/chain.enum';
import { StatModel } from '../models/stat.model';
import { ConfigService } from '../services/config.service';
import { BaseRepository } from './base.repository';

@Injectable({
  providedIn: 'root'
})
export class StatRepository extends BaseRepository<StatModel> {

  constructor(private configService: ConfigService) {
    super();
  }

  protected createDatabase(): void {
    this._db = new PouchDB('stats');
    this._db.info().then((info) => {
      console.log(info);
    });
  }

  public async getOrCreateByChainTypeAsync(type: ChainType): Promise<StatModel> {
    const id = ChainType[type];
    try {
      return await this._db.get(id);
    } catch (error) {
      const result = new StatModel({
        _id: id,
        version: this.configService.config.version
      });
      await this._db.put(result);
      return result;
    }
  }
}
