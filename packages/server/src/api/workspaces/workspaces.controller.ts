import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageChannel } from './entities/message-channel.enum';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get('/channels/:channel/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getSpecificChannel(
    @Req() { user }: Request,
    @Param('channel', new ParseEnumPipe(MessageChannel))
    channel: MessageChannel,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.workspacesService.getSpecificChannel(
      <Account>user,
      channel,
      id
    );
  }

  @Patch('/channels/:channel/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateSpecificChannel(
    @Req() { user }: Request,
    @Param('channel', new ParseEnumPipe(MessageChannel))
    channel: MessageChannel,
    @Param('id', ParseUUIDPipe) id: string
  ) {}

  @Post('/channels/:channel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createSpecificChannels(
    @Req() { user }: Request,
    @Param('channel') channel: MessageChannel
  ) {}

  @Get('/channels/:channel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getSpecificChannels(
    @Req() { user }: Request,
    @Param('channel') channel: MessageChannel
  ) {
    return this.workspacesService.getSpecificChannels(<Account>user, channel);
  }

  @Get('/channels')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getChannels(@Req() { user }: Request) {
    return this.workspacesService.getChannels(<Account>user);
  }
}
