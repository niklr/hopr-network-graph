import * as fs from 'fs';
import { ChainType } from './src/app/enums/chain.enum';
import { ConfigChainModel, ConfigModel } from './src/app/models/config.model';
import { CommonUtil } from './src/app/utils/common.util';
// import { JsonUtil } from '../app/utils/json.util';
//const JsonUtil = require('../app/utils/json.util');

class Extractor {

  public async extract(): Promise<void> {
    const config = new ConfigModel(JSON.parse(fs.readFileSync('./src/assets/config.json', 'utf8')));
    config.chains.forEach((e: ConfigChainModel) => {
      if (e.type !== ChainType.TEST) {
        this.extractChain(e);
      }
    });
  }

  private extractChain(config: ConfigChainModel): void {
    if (CommonUtil.isNullOrWhitespace(config.rpcProviderUrl)) {
      console.log(`Skipping ${ChainType[config.type]} because rpcProviderUrl is empty.`);
      return;
    }
    console.log(config.rpcProviderUrl);
  }
}

const extractor = new Extractor();
extractor.extract().finally(() => {
  console.log('Data extraction finished.');
});