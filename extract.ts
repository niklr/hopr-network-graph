import * as fs from 'fs';
import { ChainType } from './src/app/enums/chain.enum';
import { ConfigChainModel, ConfigModel } from './src/app/models/config.model';
import { ChainProxy } from './src/app/proxies/chain.proxy';
import { CommonUtil } from './src/app/utils/common.util';

class Extractor {

  private proxy: ChainProxy;

  constructor() {
    this.proxy = new ChainProxy();
  }

  public async extractAsync(): Promise<void> {
    const config = new ConfigModel(JSON.parse(fs.readFileSync('./src/assets/config.json', 'utf8')));
    config.chains.forEach(async (e: ConfigChainModel) => {
      if (e.type !== ChainType.TEST) {
        await this.extractChainAsync(e);
      }
    });
  }

  private async extractChainAsync(chain: ConfigChainModel): Promise<void> {
    if (CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      console.log(`Skipping ${ChainType[chain.type]} because rpcProviderUrl is empty.`);
      return;
    }
    console.log(chain.rpcProviderUrl);
    const events = await this.proxy.loadRawData(chain);
    console.log(events);
  }
}

const extractor = new Extractor();
extractor.extractAsync().finally(() => {
  console.log('Data extraction finished.');
});
