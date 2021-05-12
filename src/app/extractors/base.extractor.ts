import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { Ensure } from '../utils/ensure.util';

export interface IChainExtractor {
  extractAsync(chain: ChainConfigModel): Promise<EventModel[]>;
}

export abstract class BaseChainExtractor implements IChainExtractor {

  public async extractAsync(chain: ChainConfigModel): Promise<EventModel[]> {
    Ensure.notNull(chain, 'chain');
    try {
      return await this.extractAsyncInternal(chain);
    } catch (error) {
      console.log(error);
      return Promise.reject('Chain data could not be extracted.');
    }
  }

  protected abstract extractAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]>;

}
