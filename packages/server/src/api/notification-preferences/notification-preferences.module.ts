import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationPreferenceService } from './notification-preferences.service';
import { NotificationPreferenceController } from './notification-preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationPreference])],
  controllers: [NotificationPreferenceController],
  providers: [NotificationPreferenceService],
})
export class NotificationPreferenceModule {}
