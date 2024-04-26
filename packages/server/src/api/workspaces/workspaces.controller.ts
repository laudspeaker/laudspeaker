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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RavenInterceptor } from 'nest-raven';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { MessageChannel } from './entities/message-channel.enum';
import { CreateMailgunChannelDto } from './dto/mailgun/create-mailgun-channel.dto';
import { UpdateMailgunChannelDto } from './dto/mailgun/update-mailgun-channel.dto';
import { UpdateSendgridChannelDto } from './dto/sendgrid/update-sendgrid-channel.dto';
import { CreateSendgridChannelDto } from './dto/sendgrid/create-sendgrid-channel.dto';
import { UpdateTwilioChannelDto } from './dto/twilio/update-twilio-channel.dto';
import { CreateTwilioChannelDto } from './dto/twilio/create-twilio-channel.dto';
import { UpdatePushChannelDto } from './dto/push/update-push-channel.dto';
import { CreatePushChannelDto } from './dto/push/create-push-channel.dto';
import { UpdateResendChannelDto } from './dto/resend/update-resend-channel.dto';
import { CreateResendChannelDto } from './dto/resend/create-resend-channel.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getAllWorkspaces(@Req() { user }: Request) {
    return this.workspacesService.getAllWorkspaces(<Account>user);
  }

  @Patch('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public updateCurrentWorkspace(
    @Req() { user }: Request,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto
  ) {
    return this.workspacesService.updateCurrentWorkspace(
      <Account>user,
      updateWorkspaceDto
    );
  }

  @Get('/current')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getCurrentWorkspace(@Req() { user }: Request) {
    return this.workspacesService.getCurrentWorkspace(<Account>user);
  }

  @Post('/set/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public setCurrentWorkspace(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.workspacesService.setCurrentWorkspace(<Account>user, id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public createWorkspace(
    @Req() { user }: Request,
    @Body() createWorkspaceDto: CreateWorkspaceDto
  ) {
    return this.workspacesService.createWorkspace(
      <Account>user,
      createWorkspaceDto
    );
  }

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

  @Patch('/channels/resend/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateResendChannel(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResendChannelDto: UpdateResendChannelDto
  ) {
    return this.workspacesService.updateResendChannel(
      <Account>user,
      id,
      updateResendChannelDto
    );
  }

  @Post('/channels/resend')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createResendChannel(
    @Req() { user }: Request,
    @Body() createResendChannelDto: CreateResendChannelDto
  ) {
    return this.workspacesService.createResendChannel(
      <Account>user,
      createResendChannelDto
    );
  }

  @Patch('/channels/twilio/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateTwilioChannel(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTwilioChannelDto: UpdateTwilioChannelDto
  ) {
    return this.workspacesService.updateTwilioChannel(
      <Account>user,
      id,
      updateTwilioChannelDto
    );
  }

  @Post('/channels/twilio')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createTwilioChannel(
    @Req() { user }: Request,
    @Body() createTwilioChannelDto: CreateTwilioChannelDto
  ) {
    return this.workspacesService.createTwilioChannel(
      <Account>user,
      createTwilioChannelDto
    );
  }

  @Patch('/channels/push/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updatePushChannel(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePushChannelDto: UpdatePushChannelDto
  ) {
    return this.workspacesService.updatePushChannel(
      <Account>user,
      id,
      updatePushChannelDto
    );
  }

  @Post('/channels/push')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createPushChannel(
    @Req() { user }: Request,
    @Body() createPushChannelDto: CreatePushChannelDto
  ) {
    return this.workspacesService.createPushChannel(
      <Account>user,
      createPushChannelDto
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
