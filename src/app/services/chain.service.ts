import { Injectable } from '@angular/core';
import { ChainType } from '../enums/chain.enum';
import { StatModel } from '../models/stat.model';
import { StatRepository } from '../repositories/stat.repository';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ChainService {

  private _isLoading: boolean;
  private _stat: StatModel;

  constructor(private configService: ConfigService, private statRepository: StatRepository) {

  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  public get stat(): StatModel {
    return this._stat;
  }

  public async clearAllAsync(): Promise<void> {
    try {
      await this.statRepository.clearAllAsync();
    } catch (error) {
      console.log(error);
    }
  }

  public getStat(chain: ChainType): Promise<StatModel> {
    return this.statRepository.getOrCreateByChainType(chain);
  }

  public async loadAsync(chain: ChainType): Promise<void> {
    this._isLoading = true;
    this._stat = await this.statRepository.getOrCreateByChainType(chain);
    if (this._stat.version !== this.configService.config.version) {
      await this.clearAllAsync();
      this._stat = await this.statRepository.getOrCreateByChainType(chain);
    }
    // await CommonUtil.timeout(3000);
    console.log(this._stat);
    this._isLoading = false;
  }
}
