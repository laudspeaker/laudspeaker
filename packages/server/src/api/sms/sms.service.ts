import { Injectable } from '@nestjs/common';
import twillio from 'twilio';

@Injectable()
export class SmsService {
  public async getPossiblePhoneNumbers(
    smsAccountSid: string,
    smsAuthToken: string
  ) {
    const twillioClient = twillio(smsAccountSid, smsAuthToken);
    const results = await twillioClient.incomingPhoneNumbers.list({
      limit: 20,
    });

    return results.map((item) => item.phoneNumber);
  }
}
