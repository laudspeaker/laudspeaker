import {
  Controller,
  Post,
  Inject,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  HttpException,
  UseGuards,
  Param,
  Get,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyAuthGuard } from '../auth/guards/apikey-auth.guard';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';
import { CustomerPushTest } from './dto/customer-push-test.dto';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { SendFCMDto } from './dto/send-fcm.dto';
import { IdentifyCustomerDTO } from './dto/identify-customer.dto';
import { SetCustomerPropsDTO } from './dto/set-customer-props.dto';

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
    return this.eventsService.customPayload(
      <{ account: Account; workspace: Workspace }>user,
      body,
      session
    );
  }

  @Post('/send-fcm')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async sendFCMToken(@Req() { user }: Request, @Body() body: SendFCMDto) {
    const session = randomUUID();
    return this.eventsService.sendFCMToken(
      <{ account: Account; workspace: Workspace }>user,
      body,
      session
    );
  }

  @Post('/identify-customer')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async identifyCustomer(
    @Req() { user }: Request,
    @Body() body: IdentifyCustomerDTO
  ) {
    const session = randomUUID();
    return this.eventsService.identifyCustomer(
      <{ account: Account; workspace: Workspace }>user,
      body,
      session
    );
  }

  @Post('/set-customer-props')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async setCustomerProperpties(
    @Req() { user }: Request,
    @Body() body: SetCustomerPropsDTO
  ) {
    const session = randomUUID();
    return this.eventsService.setCustomerProperties(
      <{ account: Account; workspace: Workspace }>user,
      body,
      session
    );
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

  @Get('/possible-names')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getPossibleEventNames(
    @Req() { user }: Request,
    @Query('search') search: string
  ) {
    return this.eventsService.getPossibleEventNames(<Account>user, search);
  }

  @Get('/possible-event-properties')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getPossibleEventProperties(
    @Req() { user }: Request,
    @Query('event') event: string,
    @Query('search') search: string
  ) {
    return this.eventsService.getPossibleEventProperties(
      <Account>user,
      event,
      search
    );
  }

  @Post('/sendTestPush')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async sendTestPush(
    @Req() { user }: Request,
    @Body() { token }: { token: string }
  ) {
    await this.eventsService.sendTestPush(<Account>user, token);
  }

  @Post('/sendTestPushByCustomer')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async sendTestPushByCustomer(
    @Req() { user }: Request,
    @Body() body: CustomerPushTest
  ) {
    await this.eventsService.sendTestPushByCustomer(<Account>user, body);
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

  @Get('/custom-events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getCustomEvents(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string
  ) {
    const session = randomUUID();
    return this.eventsService.getCustomEvents(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      search,
      customerId
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

  @Post('/batch/')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(ApiKeyAuthGuard)
  async testEndpoint(
    @Req() { user }: Request,
    @Body() body: any
  ): Promise<void | HttpException> {
    const session = randomUUID();
    this.eventsService.batch(
      <{ account: Account; workspace: Workspace }>user,
      body,
      session
    );
    return;
  }
}
