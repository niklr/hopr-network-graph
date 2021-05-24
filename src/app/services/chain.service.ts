import { Injectable } from '@angular/core';
import { ChainExtractorType, ChainType } from '../enums/chain.enum';
import { ChainExtractorFactory } from '../factories/extractor.factory';
import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { ChainStatModel } from '../models/stat.model';
import { EventRepository } from '../repositories/event.repository';
import { StatRepository } from '../repositories/stat.repository';
import { CommonUtil } from '../utils/common.util';
import { Ensure } from '../utils/ensure.util';
import { ConfigService } from './config.service';
import { Logger } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ChainService {

  private _isExtracting: boolean;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private extractorFactory: ChainExtractorFactory,
    private statRepository: StatRepository,
    private eventRepository: EventRepository
  ) {

  }

  public get isExtracting(): boolean {
    return this._isExtracting;
  }

  public async clearAllAsync(): Promise<void> {
    try {
      this.logger.info('Clearing local data.')();
      await this.statRepository.clearAllAsync();
      await this.eventRepository.clearAllAsync();
    } catch (error) {
      this.logger.error(error)();
    }
  }

  public getChainStatByType(chainType: ChainType): Promise<ChainStatModel> {
    return this.statRepository.getOrCreateByChainTypeAsync(chainType);
  }

  public async extractAsync(): Promise<void> {
    this.logger.info('Data extraction started.')();
    this._isExtracting = true;
    for (const chain of this.configService.config.chains) {
      await this.extractChainAsync(chain.type);
    }
    this._isExtracting = false;
    this.logger.info('Data extraction ended.')();
  }

  private async extractChainAsync(type: ChainType): Promise<void> {
    if (type === ChainType.TEST) {
      return Promise.resolve();
    }

    const chain = this.configService.config.getChainByType(type);
    Ensure.notNull(chain, 'chain');

    const chainStat = await this.initChainStatAsync(chain);

    const existing = await this.eventRepository.getByChainTypeAsync(chain.type);
    if (existing && existing.length > 0) {
      this.logger.info(`Found ${existing.length} existing events for ${ChainType[chain.type]}`)();
      this._isExtracting = false;
      return;
    }
    // Use file extractor by default
    let source = ChainExtractorType.FILE;
    let events = await this.extractEventsAsync(chain, source);
    if ((!events || events?.length <= 0) && !CommonUtil.isNullOrWhitespace(chain.theGraphUrl)) {
      // Use GraphQL extractor
      source = ChainExtractorType.GRAPHQL;
      events = await this.extractEventsAsync(chain, source);
    }
    if ((!events || events?.length <= 0) && !CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      // Use RPC extractor
      source = ChainExtractorType.RPC;
      events = await this.extractEventsAsync(chain, source);
    }

    if (events?.length > 0) {
      await this.eventRepository.insertManyAsync(events);
      const lastBlock = await this.eventRepository.getLastBlockByChainTypeAsync(chain.type);
      await this.updateChainStatAsync(chainStat, true, source, lastBlock);
    } else {
      await this.eventRepository.clearByChainType(chain.type);
      await this.updateChainStatAsync(chainStat, false, source, 0);
    }
  }

  private async initChainStatAsync(chain: ChainConfigModel): Promise<ChainStatModel> {
    let result = await this.statRepository.getOrCreateByChainTypeAsync(chain.type);
    if (result.version !== this.configService.config.version) {
      await this.clearAllAsync();
      result = await this.statRepository.getOrCreateByChainTypeAsync(chain.type);
    }
    return result;
  }

  private async updateChainStatAsync(
    chainStat: ChainStatModel, success: boolean, source: ChainExtractorType, lastBlock: number
  ): Promise<void> {
    chainStat.extractSuccess = success;
    chainStat.extractedDate = new Date();
    chainStat.source = ChainExtractorType[source];
    chainStat.lastBlock = lastBlock;
    await this.statRepository.insertAsync(chainStat);
  }

  private async extractEventsAsync(chain: ChainConfigModel, extractorType: ChainExtractorType): Promise<EventModel[]> {
    try {
      const extractor = this.extractorFactory.get(extractorType);
      return await extractor.extractAsync(chain);
    } catch (error) {
      this.logger.error(error)();
      return undefined;
    }
  }
}
