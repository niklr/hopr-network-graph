import { Injectable } from '@angular/core';
import { ChainExtractorType } from '../enums/chain.enum';
import { IChainExtractor } from '../extractors/base.extractor';
import { FileChainExtractor } from '../extractors/file.extractor';

@Injectable({
  providedIn: 'root'
})
export class ChainExtractorFactory {

  constructor(private fileExtractor: FileChainExtractor) {
  }

  public get(type: ChainExtractorType): IChainExtractor {
    switch (type) {
      case ChainExtractorType.FILE:
      default:
        return this.fileExtractor;
    }
  }

}
