import { Injectable } from '@angular/core';
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

  protected init(): void {
    super.createDatabase('stats');
  }

  public async getOrCreateByChainTypeAsync(type: ChainType): Promise<StatModel> {
    const id = ChainType[type];
    try {
      let result = await super.getByIdAsync(id);
      if (!result) {
        result = new StatModel({
          _id: id,
          version: this.configService.config.version
        });
        await super.insertAsync(result);
      }
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
