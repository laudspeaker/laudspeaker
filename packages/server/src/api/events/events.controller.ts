import {
  Controller,
  Post,
  Inject,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Headers,
  HttpException,
  UseGuards,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { StatusJobDto } from './dto/status-event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobTypes } from './interfaces/event.interface';
import { ApiKeyAuthGuard } from '../auth/guards/apikey-auth.guard';
import { Job } from 'bull';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(EventsService)
    private readonly eventsService: EventsService
  ) {}

  @Post('job-status/email')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobEmailStatus(@Body() body: StatusJobDto): Promise<string> {
    return this.eventsService.getJobStatus(body, JobTypes.email);
  }

  @Post('job-status/slack')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobSlackStatus(@Body() body: StatusJobDto): Promise<string> {
    return this.eventsService.getJobStatus(body, JobTypes.slack);
  }

  @Post('job-status/sms')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobSMSStatus(@Body() body: StatusJobDto): Promise<string> {
    return this.eventsService.getJobStatus(body, JobTypes.sms);
  }

  @Post('/posthog/')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ApiKeyAuthGuard)
  async getPostHogPayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: PosthogBatchEventDto
  ): Promise<Job<any> | HttpException> {
    return this.eventsService.getPostHogPayload(apiKey, body);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ApiKeyAuthGuard)
  async enginePayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: EventDto
  ): Promise<Job<any>  | HttpException> {
    return this.eventsService.enginePayload(apiKey, body);
  }

  @Get('/possible-attributes/:resourceId?')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getAttributes(
    @Param('resourceId') resourceId = '',
    @Query('provider') provider
  ) {
    return this.eventsService.getAttributes(resourceId, provider || undefined);
  }

  @Get('/attributes/:resourceId?')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getOrUpdateAttributes(@Param('resourceId') resourceId = '') {
    return this.eventsService.getOrUpdateAttributes(resourceId);
  }

  @Get('/possible-types')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPossibleTypes() {
    return this.eventsService.getPossibleTypes();
  }

  @Get('/possible-comparison/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPossibleComparison(@Param('type') type: string) {
    return this.eventsService.getPossibleComparisonTypes(type);
  }

  @Get('/possible-values/:key')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPossibleValues(
    @Param('key') key: string,
    @Query('search') search: string
  ) {
    return this.eventsService.getPossibleValues(key, search);
  }

  @Get('/possible-posthog-types')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPossiblePothogTypes(@Query('search') search: string) {
    return this.eventsService.getPossiblePosthogTypes(search);
  }
}
