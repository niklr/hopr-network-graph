import PouchDB from 'pouchdb';
import PouchdbFind from 'pouchdb-find';

export abstract class BaseRepository<T> {

  protected _db: PouchDB.Database<T>;

  constructor() {
    PouchDB.plugin(PouchdbFind);
    this.init();
  }

  protected abstract init(): void;

  protected createDatabase(name: string): void {
    this._db = new PouchDB(name);
    this._db.info().then((info) => {
      console.log(info);
    });
  }

  public get entities(): PouchDB.Database<T> {
    return this._db;
  }

  public async clearAllAsync(): Promise<void> {
    try {
      await this._db.destroy();
      this.init();
    } catch (error) {
      console.log(error);
    }
  }
}
