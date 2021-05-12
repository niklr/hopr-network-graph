import { Injectable } from '@angular/core';
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

  protected init(): void {
    super.createDatabase('events');
  }

  public getByChainTypeAsync(type: ChainType): Promise<EventModel[]> {
    try {
      return Promise.resolve(this._db({ type }).get());
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
