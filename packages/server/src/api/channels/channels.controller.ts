import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChannelType, Provider } from './interfaces/channel.interface';
import { RavenInterceptor } from 'nest-raven';
import { ChannelsService } from './channels.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';

@Controller('channels')
export class ChannelsController {
  constructor(
    @Inject(ChannelsService) private channelsService: ChannelsService,
  ) { }

  @Post(':channelType/:providerName/fetch-info')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getProviderInfo(
    @Param('channelType') channelType: ChannelType,
    @Param('providerName') providerName: Provider,
    @Req() { user }: Request,
    @Body() fetchProviderInfoDTO: any,
  ) {
    return await this.channelsService.fetchDTO(<Account>user, channelType, providerName, fetchProviderInfoDTO);
  }

  @Post(':channelType/:providerName/send')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async sendMessage(
    @Param('channelType') channelType: ChannelType,
    @Param('providerName') providerName: Provider,
    @Req() { user }: Request,
    @Body() sendMessageDTO: any,
  ) {
    return await this.channelsService.sendDTO(<Account>user, channelType, providerName, sendMessageDTO);
  }

  @Post(':channelType/:providerName/setup')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async setupProvider(
    @Param('channelType') channelType: ChannelType,
    @Param('providerName') providerName: Provider,
    @Req() { user }: Request,
    @Body() setupCallbackDTO: any,
  ) {
    return await this.channelsService.setupDTO(<Account>user, channelType, providerName, setupCallbackDTO);
  }

  @Post(':channelType/:providerName/callback')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async handleCallback(
    @Param('channelType') channelType: ChannelType,
    @Param('providerName') providerName: Provider,
    @Req() request: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return await this.channelsService.handleCallback(channelType, providerName, request, query, body);
  }

  @Delete(':channelType/:providerName')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async removeProvider(
    @Param('channelType') channelType: ChannelType,
    @Param('providerName') providerName: Provider,
    @Req() { user }: Request,
  ) {
    return await this.channelsService.remove(<Account>user, channelType, providerName);
  }
}
