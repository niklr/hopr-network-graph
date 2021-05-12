import { ChainConfigModel } from '../models/config.model';
import { EventModel } from '../models/event.model';
import { Ensure } from '../utils/ensure.util';

export interface IChainLoader {
  loadAsync(chain: ChainConfigModel): Promise<EventModel[]>;
}

export abstract class BaseChainLoader implements IChainLoader {

  public async loadAsync(chain: ChainConfigModel): Promise<EventModel[]> {
    Ensure.notNull(chain, 'chain');
    try {
      return await this.loadAsyncInternal(chain);
    } catch (error) {
      console.log(error);
      return Promise.reject('Chain data could not be loaded.');
    }
  }

  protected abstract loadAsyncInternal(chain: ChainConfigModel): Promise<EventModel[]>;

}
