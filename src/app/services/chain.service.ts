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
    let source = ChainExtractorType.UNKNOWN;
    if ((!events || events?.length <= 0) && !CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      // Use RPC extractor
      source = ChainExtractorType.RPC;
      events = await this.extractEventsAsync(chain, source);
    }
    if (!events || events?.length <= 0) {
      // Use file extractor
      source = ChainExtractorType.FILE;
      events = await this.extractEventsAsync(chain, source);
    }

    if (events?.length > 0) {
      await this.eventRepository.insertManyAsync(events);
      const lastBlock = await this.eventRepository.getLastBlockByChainTypeAsync(chain.type);
      await this.updateStatAsync(true, source, lastBlock);
    } else {
      await this.eventRepository.clearByChainType(chain.type);
      await this.updateStatAsync(false, source, 0);
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

  private async updateStatAsync(success: boolean, source: ChainExtractorType, lastBlock: number): Promise<void> {
    this._stat.extractSuccess = success;
    this._stat.extractedDate = new Date();
    this._stat.source = ChainExtractorType[source];
    this._stat.lastBlock = lastBlock;
    await this.statRepository.insertAsync(this._stat);
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
