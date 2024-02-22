import {
  Body,
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
import { CreateMailgunChannelDto } from './dto/mailgun/create-mailgun-channel.dto';
import { UpdateMailgunChannelDto } from './dto/mailgun/update-mailgun-channel.dto';
import { UpdateSendgridChannelDto } from './dto/sendgrid/update-sendgrid-channel.dto';
import { CreateSendgridChannelDto } from './dto/sendgrid/create-sendgrid-channel.dto';

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

  @Patch('/channels/mailgun/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateMailgunChannel(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMailgunChannelDto: UpdateMailgunChannelDto
  ) {
    return this.workspacesService.updateMailgunChannel(
      <Account>user,
      id,
      updateMailgunChannelDto
    );
  }

  @Post('/channels/mailgun')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createMailgunChannel(
    @Req() { user }: Request,
    @Body() createMailgunChannelDto: CreateMailgunChannelDto
  ) {
    return this.workspacesService.createMailgunChannel(
      <Account>user,
      createMailgunChannelDto
    );
  }

  @Patch('/channels/sendgrid/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateSendgridChannel(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSendgridChannelDto: UpdateSendgridChannelDto
  ) {
    return this.workspacesService.updateSendgridChannel(
      <Account>user,
      id,
      updateSendgridChannelDto
    );
  }

  @Post('/channels/sendgrid')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createSendgridChannel(
    @Req() { user }: Request,
    @Body() createMailgunChannelDto: CreateSendgridChannelDto
  ) {
    return this.workspacesService.createSendgridChannel(
      <Account>user,
      createMailgunChannelDto
    );
  }

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
