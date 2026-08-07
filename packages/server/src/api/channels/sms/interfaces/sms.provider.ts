import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';
import { SMSCredentials, SMSProviderData, SMSCallbackData, SMSSendingData, SMSSetupData } from './sms.data';

/**
 * Base interface to be implemented by any SMS channel provider
 */
export interface SMSProvider {
  /**
   * Uses credentials to retrieve any information required to set up a channel,
   * for example the domain or phone number to send from
   * @param apiKey 
   */
  fetch<T extends SMSCredentials, U extends SMSProviderData>(credentials: Credentials<T>): Promise<ProviderData<U>>;
  /**
   * Uses the provided credentials to send a message of type T, to the recepient
   * specified by the contact information, with the selected content. Returns 
   * information about what happened during the send
   * @param data 
   */
  send<T extends SMSCredentials, U extends SMSSendingData>(credentials: Credentials<T>, data: SendingData<U>): Promise<ClickHouseMessage[]>;
  /**
   * Uses the provided credentials to set up the required callback handling, for
   * example setting up the webhooks to hit laudspeaker etc
   * @param apiKey 
   * @param domain 
   */
  setup<T extends SMSCredentials, U extends SMSSetupData>(credentials: Credentials<T>, data: SetupData<U>): Promise<void>;
  /**
   * Uses the provided credentials to handle any callback information from the
   * service, potentially verifying the calbacks authenticity and parsing 
   * the callback data 
   * 
   */
  handle<T extends SMSCredentials, U extends SMSCallbackData>(credentials: Credentials<T>, data: CallbackData<U>): Promise<ClickHouseMessage[]>;
  /**
   * Uses the provided credentials to remove any callback handlers that were
   * setup using the setup callback handler; used when a provider is 
   * removed from an account.
   */
  remove<T extends SMSCredentials>(credentials: Credentials<T>): Promise<void>;
}
