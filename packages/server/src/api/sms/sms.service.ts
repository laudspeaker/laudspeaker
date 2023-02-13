import { Injectable } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  public async getPossiblePhoneNumbers(
    smsAccountSid: string,
    smsAuthToken: string
  ) {
    const twilioClient = twilio(smsAccountSid, smsAuthToken);
    const results = await twilioClient.incomingPhoneNumbers.list({
      limit: 20,
    });

    return results.map((item) => item.phoneNumber);
  }
}
