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
  Req,
  Logger,
} from '@nestjs/common';
import { StatusJobDto } from './dto/status-event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobTypes } from './interfaces/event.interface';
import { ApiKeyAuthGuard } from '../auth/guards/apikey-auth.guard';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(EventsService)
    private readonly eventsService: EventsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: EventsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: EventsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: EventsController.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: EventsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Post('/posthog/')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async posthogPayload(
    @Req() { user }: Request,
    @Body() body: PosthogBatchEventDto
  ): Promise<void | HttpException> {
    const session = randomUUID();
    return; //this.eventsService.posthogPayload(<Account>user, body, session);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async customPayload(
    @Req() { user }: Request,
    @Body() body: EventDto
  ): Promise<void | HttpException> {
    const session = randomUUID();
    return this.eventsService.customPayload(<Account>user, body, session);
  }

  @Get('/possible-attributes/:resourceId?')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getAttributes(
    @Req() { user }: Request,
    @Param('resourceId') resourceId = '',
    @Query('provider') provider
  ) {
    const session = randomUUID();
    return this.eventsService.getAttributes(
      resourceId,
      (<Account>user).id,
      session,
      provider || undefined
    );
  }

  @Get('/attributes/:resourceId?')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getOrUpdateAttributes(@Param('resourceId') resourceId = '') {
    const session = randomUUID();
    return this.eventsService.getOrUpdateAttributes(resourceId, session);
  }

  @Get('/possible-types')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPossibleTypes() {
    const session = randomUUID();
    return this.eventsService.getPossibleTypes(session);
  }

  @Get('/possible-comparison/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPossibleComparison(@Param('type') type: string) {
    const session = randomUUID();
    return this.eventsService.getPossibleComparisonTypes(type, session);
  }

  @Get('/possible-values/:key')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPossibleValues(
    @Param('key') key: string,
    @Query('search') search: string
  ) {
    const session = randomUUID();
    return this.eventsService.getPossibleValues(key, search, session);
  }

  @Get('/possible-posthog-types')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPossiblePothogTypes(
    @Query('search') search: string,
    @Req() { user }: Request
  ) {
    const session = randomUUID();
    return this.eventsService.getPossiblePosthogTypes(
      (<Account>user).id,
      session,
      search
    );
  }

  @Get('/posthog-events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPosthogEvents(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string
  ) {
    const session = randomUUID();
    return this.eventsService.getPosthogEvents(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      search
    );
  }
}
