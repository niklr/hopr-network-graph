import { Injectable } from '@angular/core';
import { ChainExtractorType, ChainType } from '../enums/chain.enum';
import { ChainExtractorFactory } from '../factories/extractor.factory';
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

  private _isExtracting: boolean;
  private _stat: StatModel;

  constructor(
    private configService: ConfigService,
    private extractorFactory: ChainExtractorFactory,
    private statRepository: StatRepository,
    private eventRepository: EventRepository
  ) {

  }

  public get isExtracting(): boolean {
    return this._isExtracting;
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

  public async extractAsync(type: ChainType): Promise<void> {
    this._isExtracting = true;
    const chain = this.configService.config.getChainByType(type);
    Ensure.notNull(chain, 'chain');

    await this.initStatAsync(chain);

    const existing = await this.eventRepository.getByChainTypeAsync(chain.type);
    if (existing && existing.length > 0) {
      console.log(`Found ${existing.length} existing events for ${ChainType[chain.type]}`);
      this._isExtracting = false;
      return;
    }
    let events: EventModel[];
    if ((!events || events?.length <= 0) && !CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      // Use RPC extractor
      events = await this.extractEventsAsync(chain, ChainExtractorType.RPC);
    }
    if (!events || events?.length <= 0) {
      // Use file extractor
      events = await this.extractEventsAsync(chain, ChainExtractorType.FILE);
    }

    if (events?.length > 0) {
      await this.updateStatAsync(true);
      await this.eventRepository.insertAsync(events);
    } else {
      await this.updateStatAsync(false);
    }

    this._isExtracting = false;
  }

  private async initStatAsync(chain: ChainConfigModel): Promise<void> {
    let result = await this.statRepository.getOrCreateByChainTypeAsync(chain.type);
    if (result.version !== this.configService.config.version) {
      await this.clearAllAsync();
      result = await this.statRepository.getOrCreateByChainTypeAsync(chain.type);
    }
    this._stat = result;
  }

  private async updateStatAsync(success: boolean): Promise<void> {
    this._stat.extractSuccess = success;
    this._stat.extractedDate = new Date();
    await this.statRepository.entities.put(this._stat);
  }

  private async extractEventsAsync(chain: ChainConfigModel, extractorType: ChainExtractorType): Promise<EventModel[]> {
    try {
      const extractor = this.extractorFactory.get(extractorType);
      return await extractor.extractAsync(chain);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
