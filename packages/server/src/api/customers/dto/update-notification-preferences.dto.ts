import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsString()
  customerId: string;

  @IsString()
  workspaceId: string;

  @IsBoolean()
  @IsOptional()
  unsubscribeFromAll?: boolean;

  @IsArray()
  @IsOptional()
  preferences: { id: string; subscribed: boolean }[];
}
