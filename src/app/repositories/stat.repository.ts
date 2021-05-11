import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { ChainType } from '../enums/chain.enum';
import { StatModel } from '../models/stat.model';
import { BaseRepository } from './base.repository';

@Injectable({
  providedIn: 'root'
})
export class StatRepository extends BaseRepository<StatModel> {

  constructor() {
    super();
  }

  protected createDatabase(): void {
    this._db = new PouchDB('stats');
    this._db.info().then((info) => {
      console.log(info);
    });
  }

  public async getOrCreateByChainType(type: ChainType): Promise<StatModel> {
    const id = ChainType[type];
    return this._db.get(id).then(result1 => {
      return result1;
    }).catch(error1 => {
      if (error1?.status === 404) {
        const result = new StatModel({
          _id: id
        });
        return this._db.put(result).then(result2 => {
          return result;
        }).catch(() => {
          return undefined;
        });
      } else {
        return undefined;
      }
    });
  }
}
