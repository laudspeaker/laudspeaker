import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';
import { EmailCredentials, EmailProviderData, EmailCallbackData, EmailSendingData, EmailSetupData } from './email.data';

/**
 * Base interface to be implemented by any email channel provider
 */
export interface EmailProvider {
  /**
   * Uses credentials to retrieve any information required to set up a channel,
   * for example the domain or phone number to send from
   * @param apiKey 
   */
  fetch<T extends EmailCredentials, U extends EmailProviderData>(credentials: Credentials<T>): Promise<ProviderData<U>>;
  /**
   * Uses the provided credentials to send a message of type T, to the recepient
   * specified by the contact information, with the selected content. Returns 
   * information about what happened during the send
   * @param data 
   */
  send<T extends EmailCredentials, U extends EmailSendingData>(credentials: Credentials<T>, data: SendingData<U>): Promise<ClickHouseMessage[]>;
  /**
   * Uses the provided credentials to set up the required callback handling, for
   * example setting up the webhooks to hit laudspeaker etc
   * @param apiKey 
   * @param domain 
   */
  setup<T extends EmailCredentials, U extends EmailSetupData>(credentials: Credentials<T>, data: SetupData<U>): Promise<void>;
  /**
   * Uses the provided credentials to handle any callback information from the
   * service, potentially verifying the calbacks authenticity and parsing 
   * the callback data 
   * 
   */
  handle<T extends EmailCredentials, U extends EmailCallbackData>(credentials: Credentials<T>, data: CallbackData<U>): Promise<ClickHouseMessage[]>;
  /**
   * Uses the provided credentials to remove any callback handlers that were
   * setup using the setup callback handler; used when a provider is 
   * removed from an account.
   */
  remove<T extends EmailCredentials>(credentials: Credentials<T>): Promise<void>;
}
