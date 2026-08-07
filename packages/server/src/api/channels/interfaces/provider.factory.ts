import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { providerMapping } from './provider.mapping';
import { BaseLiquidEngineProvider } from './base.provider';
import { EmailProvider } from '../email/interfaces/email.provider';
import { SMSProvider } from '../sms/interfaces/sms.provider';

@Injectable()
export class ProviderFactory {
  constructor(private readonly moduleRef: ModuleRef) {}

  getProvider(providerType: string): EmailProvider | SMSProvider {
    const providerClass = providerMapping[providerType];
    if (!providerClass) {
      throw new Error(`Provider ${providerType} not found`);
    }

    const providerInstance = this.moduleRef.get(providerClass, { strict: false });
    if (!providerInstance) {
      throw new Error(`Provider instance for ${providerType} not found`);
    }

    return providerInstance;
  }
}
