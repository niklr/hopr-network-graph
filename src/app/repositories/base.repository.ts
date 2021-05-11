export abstract class BaseRepository<T> {

  protected _db: PouchDB.Database<T>;

  constructor() {
    this.createDatabase();
  }

  protected abstract createDatabase(): void;

  public get entities(): PouchDB.Database<T> {
    return this._db;
  }

  public async clearAllAsync(): Promise<void> {
    try {
      await this._db.destroy();
      this.createDatabase();
    } catch (error) {
      console.log(error);
    }
  }
}
