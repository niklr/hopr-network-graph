import { Injectable } from '@angular/core';
import { ChainLoaderType } from '../enums/chain.enum';
import { IChainLoader } from '../loaders/base.loader';
import { FileChainLoader } from '../loaders/file.loader';

@Injectable({
  providedIn: 'root'
})
export class ChainLoaderFactory {

  constructor(private fileLoader: FileChainLoader) {
  }

  public get(type: ChainLoaderType): IChainLoader {
    switch (type) {
      case ChainLoaderType.FILE:
      default:
        return this.fileLoader;
    }
  }

}
