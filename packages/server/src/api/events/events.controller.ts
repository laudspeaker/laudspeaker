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
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(EventsService)
    private readonly eventsService: EventsService
  ) {}

  @Post('job-status/email')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobEmailStatus(@Body() body: StatusJobDto): Promise<string> {
    return this.eventsService.getJobEmailStatus(body);
  }

  @Post('job-status/slack')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobSlackStatus(@Body() body: StatusJobDto): Promise<string> {
    return this.eventsService.getJobSlackStatus(body);
  }

  @Post('/posthog/')
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostHogPayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: PosthogBatchEventDto
  ): Promise<WorkflowTick[] | HttpException> {
    return this.eventsService.getPostHogPayload(apiKey, body);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async enginePayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: EventDto
  ): Promise<WorkflowTick[] | HttpException> {
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
