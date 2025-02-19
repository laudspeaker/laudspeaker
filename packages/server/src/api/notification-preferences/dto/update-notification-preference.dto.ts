import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationPreferenceDto } from './create-notification-preference.dto';

export class UpdateNotificationPreferenceDto extends PartialType(CreateNotificationPreferenceDto) {}
