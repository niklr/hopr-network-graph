import { Injectable } from '@angular/core';
import { TheGraphClient } from '../clients/thegraph.client';
import { ChainType } from '../enums/chain.enum';
import { ChainConfigModel } from '../models/config.model';
import { EventModel, TransferEventModel } from '../models/event.model';
import { SubgraphTokenTypes, SubgraphTransactionModel, SubgraphTransferEventModel } from '../models/subgraph.model';
import { Logger } from '../services/logger.service';
import { CommonUtil } from '../utils/common.util';
import { BaseChainExtractor } from './base.extractor';

@Injectable({
  providedIn: 'root'
})
export class GraphqlChainExtractor extends BaseChainExtractor {

  constructor(protected logger: Logger, private client: TheGraphClient) {
    super(logger);
  }

  protected get name(): string {
    return 'GraphQL';
  }

  protected async extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]> {
    const stat = await this.client.getStatContainer(chain.theGraphUrl);
    if (!stat) {
      throw new Error(`${this.name} stat container could not be retrieved.`);
    }
    const stepSize = 10;
    const transactionCount = CommonUtil.tryParseInt(stat.lastTransactionIndex);
    // Get all transactions and transform them
    const events: EventModel[] = [];
    const transactions = await this.client.getTransactions(chain.theGraphUrl, 10);
    this.transform(chain.type, transactions, events);
    return events;
  }

  private transform(chainType: ChainType, transactions: SubgraphTransactionModel[], events: EventModel[]): void {
    if (transactions && events) {
      for (const transaction of transactions) {
        for (const transfer of transaction.transferEvents) {
          if (!this.shouldSkip(chainType, transfer.tokenType)) {
            const event = this.transformTransfer(chainType, transaction, transfer);
            if (event) {
              events.push(event);
            }
          }
        }
      }
    }
  }

  private transformTransfer(
    chainType: ChainType, transaction: SubgraphTransactionModel, transfer: SubgraphTransferEventModel
  ): TransferEventModel {
    if (transfer) {
      return new TransferEventModel({
        chainType,
        blockNumber: CommonUtil.tryParseInt(transfer.blockNumber),
        blockTimestamp: transfer.blockTimestamp,
        transactionHash: transaction.id,
        logIndex: CommonUtil.tryParseInt(transfer.logIndex),
        argsFrom: transfer.from,
        argsTo: transfer.to,
        argsAmount: transfer.amount
      });
    }
    return undefined;
  }

  private shouldSkip(chainType: ChainType, tokenType: string): boolean {
    if (chainType === ChainType.XDAI_MAIN && tokenType !== SubgraphTokenTypes.XHOPR) {
      return true;
    }
    return false;
  }
}
