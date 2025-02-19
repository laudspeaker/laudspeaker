import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
} from '@nestjs/common';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import { NotificationPreferenceService } from './notification-preferences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RavenInterceptor } from 'nest-raven';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { randomUUID } from 'node:crypto';

@Controller('notification-preferences')
export class NotificationPreferenceController extends BaseLaudspeakerService {
  constructor(
    @Inject(NotificationPreferenceService)
    private readonly notificationPreferenceService: NotificationPreferenceService) {
    super()
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Post()
  async create(
    @Req() { user }: Request,
    @Body() createNotificationPreferenceDto: CreateNotificationPreferenceDto) {
    const session = randomUUID();
    return this.notificationPreferenceService.create(<Account>user, session, createNotificationPreferenceDto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Get()
  async findAll(
    @Req() { user }: Request
  ) {
    const session = randomUUID();
    return this.notificationPreferenceService.findAll(<Account>user,session);
  }

  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Get('/:workspaceId')
  async findAllUnauthenticated(
    @Param() { workspaceId }: { workspaceId: string }
  ) {
    const session = randomUUID();
    return this.notificationPreferenceService.findAllUnauthenticated(workspaceId,session);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Get(':id')
  async findOne(
    @Req() { user }: Request,
    @Param('id') id: string,
  ) {
    const session = randomUUID();
    return this.notificationPreferenceService.findOne(<Account>user, session, id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Patch(':id')
  async update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateNotificationPreferenceDto: UpdateNotificationPreferenceDto,
  ) {
    const session = randomUUID();
    return this.notificationPreferenceService.update(<Account>user, session, id, updateNotificationPreferenceDto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @Delete(':id')
  async remove(
    @Req() { user }: Request,
    @Param('id') id: string,
  ) {
    const session = randomUUID();
    return this.notificationPreferenceService.remove(<Account>user, session, id);
  }
}
