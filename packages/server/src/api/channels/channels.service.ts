/* eslint-disable no-case-declarations */
import {
  Inject,
  Injectable
} from '@nestjs/common';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import { ProviderFactory } from './interfaces/provider.factory';
import { Account } from '../accounts/entities/accounts.entity';
import { ChannelType, Provider } from './interfaces/channel.interface';
import { EmailCredentials, EmailSetupData } from './email/interfaces/email.data';
import { SMSCredentials, SMSSetupData } from './sms/interfaces/sms.data';

@Injectable()
export class ChannelsService extends BaseLaudspeakerService {
  constructor(@Inject(ProviderFactory) private readonly providerFactory: ProviderFactory) {
    super();
  }

  private generateCreds(providerName: Provider, data: any): EmailCredentials | SMSCredentials {
    switch (providerName) {
      case Provider.MAILGUN:
      default:
        return { apiKey: data.apiKey }
    }
  }


  private generateSetupData(providerName: Provider, data: any): EmailSetupData | SMSSetupData {
    switch (providerName) {
      case Provider.MAILGUN:
      default:
        return { apiKey: data.apiKey }
    }
  }

  async remove(account: Account, channelType: ChannelType, providerName: Provider) {
    const provider = this.providerFactory.getProvider(providerName);
    return await provider.remove({ credentials: '' });
  }

  async handleCallback(channelType: ChannelType, providerName: Provider, request: any, query: any, body: any) {
    const provider = this.providerFactory.getProvider(providerName);
    const callbackData = { data: { request, body } };
    return await provider.handle({ credentials: '' }, callbackData);
  }

  async setupDTO(account: Account, channelType: ChannelType, providerName: Provider, setupCallbackDTO: any) {
    const provider = this.providerFactory.getProvider(providerName);
    const { credentials, data, metadata } = setupCallbackDTO;
    return await provider.setup({ credentials }, { data, metadata });
  }

  async sendDTO(account: Account, channelType: ChannelType, providerName: Provider, sendMessageDTO: any) {
    const provider = this.providerFactory.getProvider(providerName);
    const { credentials, data, metadata } = sendMessageDTO;
    return await provider.send({ credentials }, { data, metadata });
  }

  async fetchDTO(account: Account, channelType: ChannelType, providerName: Provider, fetchProviderInfoDTO: any) {
    const provider = this.providerFactory.getProvider(providerName);
    const credentials = this.generateCreds(providerName, fetchProviderInfoDTO);
    return await provider.fetch({ credentials });
  }
}
