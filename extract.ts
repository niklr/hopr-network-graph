import { ChainType } from './src/app/enums/chain.enum';
import { ConfigChainModel, ConfigModel } from './src/app/models/config.model';
import { ChainProxy } from './src/app/proxies/chain.proxy';
import { CommonUtil } from './src/app/utils/common.util';
import { LocalFileUtil } from './src/app/utils/local-file.util';

class Extractor {

  private fileUtil: LocalFileUtil;
  private proxy: ChainProxy;

  constructor() {
    this.fileUtil = new LocalFileUtil();
    this.fileUtil.baseDir = __dirname;
    this.proxy = new ChainProxy(this.fileUtil);
  }

  public async extractAsync(): Promise<void> {
    const rawConfig = await this.fileUtil.readFileAsync('./src/assets/config.json');
    const config = new ConfigModel(JSON.parse(rawConfig));
    for (const chain of config.chains) {
      if (chain.type !== ChainType.TEST) {
        await this.extractChainAsync(chain);
      }
    }
  }

  private async extractChainAsync(chain: ConfigChainModel): Promise<void> {
    const chainName = ChainType[chain.type];
    if (CommonUtil.isNullOrWhitespace(chain.rpcProviderUrl)) {
      console.log(`Skipping ${chainName} because rpcProviderUrl is empty.`);
      return;
    }
    console.log(`Extract ${chainName} started.`);
    const events = await this.proxy.getAllEvents(chain);
    console.log(`Extract ${chainName} ended.`);
    this.fileUtil.writeFile(CommonUtil.toJsonString(events), `./src/assets/data/${chainName}_EVENTS.json`);
  }
}

const extractor = new Extractor();
extractor.extractAsync().finally(() => {
  console.log('Data extraction finished.');
});
