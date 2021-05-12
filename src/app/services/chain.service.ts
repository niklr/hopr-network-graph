import { Injectable } from '@angular/core';
import { ChainLoaderType, ChainType } from '../enums/chain.enum';
import { ChainLoaderFactory } from '../factories/loader.factory';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { StatModel } from '../models/stat.model';
import { EventRepository } from '../repositories/event.repository';
import { StatRepository } from '../repositories/stat.repository';
import { CommonUtil } from '../utils/common.util';
import { Ensure } from '../utils/ensure.util';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ChainService {

  private _isLoading: boolean;
  private _stat: StatModel;

  constructor(
    private configService: ConfigService,
    private loaderFactory: ChainLoaderFactory,
    private statRepository: StatRepository,
    private eventRepository: EventRepository
  ) {

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
      await this.eventRepository.clearAllAsync();
    } catch (error) {
      console.log(error);
    }
  }

  public async loadAsync(type: ChainType): Promise<void> {
    this._isLoading = true;
    const chain = this.configService.config.getChainByType(type);
    Ensure.notNull(chain, 'chain');
    await this.initStatAsync(type);
    await this.initEventsAsync(chain);
    this._isLoading = false;
  }

  private async initStatAsync(type: ChainType): Promise<void> {
    let result = await this.statRepository.getOrCreateByChainTypeAsync(type);
    if (result.version !== this.configService.config.version) {
      await this.clearAllAsync();
      result = await this.statRepository.getOrCreateByChainTypeAsync(type);
    }
    this._stat = result;
  }

  private async initEventsAsync(chain: ChainConfigModel): Promise<void> {
    const existing = await this.eventRepository.getByChainTypeAsync(chain.type);
    if (existing && existing.length > 0) {
      return;
    }
    let events: EventModel[];
    if ((!events || events?.length <= 0) && !CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      // Use RPC loader
      events = await this.loadEventsAsync(chain, ChainLoaderType.RPC);
    }
    if (!events || events?.length <= 0) {
      // Use file loader
      events = await this.loadEventsAsync(chain, ChainLoaderType.FILE);
    }
    if (events?.length > 0) {
      this.eventRepository.insertAsync(events);
    }
  }

  private async loadEventsAsync(chain: ChainConfigModel, loaderType: ChainLoaderType): Promise<EventModel[]> {
    try {
      const loader = this.loaderFactory.get(loaderType);
      return await loader.loadAsync(chain);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
