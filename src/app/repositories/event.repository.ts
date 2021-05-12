import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { ChainType } from '../enums/chain.enum';
import { EventModel } from '../models/event.model';
import { BaseRepository } from './base.repository';

@Injectable({
  providedIn: 'root'
})
export class EventRepository extends BaseRepository<EventModel> {

  constructor() {
    super();
  }

  protected createDatabase(): void {
    this._db = new PouchDB('events');
    this._db.info().then((info) => {
      console.log(info);
    });
  }

  public async getByChainTypeAsync(type: ChainType): Promise<EventModel[]> {
    try {
      const result = await this._db.find({
        selector: {
          type
        }
      });
      return result.docs;
    } catch (error) {
      return undefined;
    }
  }

  public async insertAsync(items: EventModel[]): Promise<void> {
    const result = await this._db.bulkDocs(items);
    if (result?.filter((e: any) => e.error === true).length > 0) {
      // await this._db.remove(items);
      throw new Error('Insert failed.');
    }
  }
}
