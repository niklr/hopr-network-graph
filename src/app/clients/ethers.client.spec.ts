import { TestBed } from '@angular/core/testing';
import { AppModule } from '../app.module';
import { ChainTxEventType } from '../enums/chain.enum';
import { ConfigService } from '../services/config.service';
import { EthersClient } from './ethers.client';

describe('EthersClient', () => {
  let client: EthersClient;
  let configService: ConfigService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    });
    client = TestBed.inject(EthersClient);
    configService = TestBed.inject(ConfigService);
    await configService.initAsync();
  });

  it('should be created', async () => {
    expect(client).toBeTruthy();
  });

  it('should get transaction event name', async () => {
    expect(client.getTxEventName(configService.config.chains[0], ChainTxEventType.BURN)).toBeUndefined();
    expect(client.getTxEventName(configService.config.chains[1], ChainTxEventType.BURN)).toBe('Burned');
    expect(client.getTxEventName(configService.config.chains[2], ChainTxEventType.BURN)).toBe('Burn');
  });
});
