import { Injectable } from '@angular/core';
import { ChainExtractorType } from '../enums/chain.enum';
import { IChainExtractor } from '../extractors/base.extractor';
import { FileChainExtractor } from '../extractors/file.extractor';
import { GraphqlChainExtractor } from '../extractors/graphql.extractor';
import { RpcChainExtractor } from '../extractors/rpc.extractor';

@Injectable({
  providedIn: 'root'
})
export class ChainExtractorFactory {

  constructor(
    private fileExtractor: FileChainExtractor,
    private rpcExtractor: RpcChainExtractor,
    private graphqlExtractor: GraphqlChainExtractor
  ) {
  }

  public get(type: ChainExtractorType): IChainExtractor {
    switch (type) {
      case ChainExtractorType.GRAPHQL:
        return this.graphqlExtractor;
      case ChainExtractorType.RPC:
        return this.rpcExtractor;
      case ChainExtractorType.FILE:
      default:
        return this.fileExtractor;
    }
  }

}
