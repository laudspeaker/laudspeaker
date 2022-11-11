import { Expose } from 'class-transformer';

export class AccountSettingsResponse {
  @Expose()
  public apiKey!: string;

  @Expose()
  public email: string | null;

  @Expose()
  public firstName: string | null;

  @Expose()
  public lastName: string | null;

  @Expose()
  public onboarded: boolean;

  @Expose()
  public expectedOnboarding: string[];
}
