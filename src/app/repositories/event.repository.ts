import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
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
}
