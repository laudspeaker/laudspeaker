import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { TestsService } from './tests.service';
import { DevelopmentGuard } from '../auth/guards/development.guard';
import { randomUUID } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('tests')
@UseGuards(DevelopmentGuard)
export class TestsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(TestsService) private testsService: TestsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: TestsController.name,
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
        class: TestsController.name,
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
        class: TestsController.name,
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
        class: TestsController.name,
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
        class: TestsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Post('posthogsynctest')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async posthogsynctest(@Req() { user }: Request) {
    const session = randomUUID();
    return this.testsService.posthogsynctest(user, session);
  }

  @Get('reset-tests')
  async resetTestData() {
    const session = randomUUID();
    return this.testsService.resetTestData(session);
  }

  @Get('test-verification/:email')
  async getTestVerification(@Param('email') email) {
    const session = randomUUID();
    return this.testsService.getTestVerification(email, session);
  }

  @Patch('test-account')
  async updateTestAccount(@Body() body: any) {
    const session = randomUUID();
    return this.testsService.updateTestAccount(body, session);
  }

  @Patch('verify-test-account/:id')
  async verifyTestAccount(@Param('id') id: string) {
    const session = randomUUID();
    return this.testsService.verifyTestAccount(id, session);
  }

  @Get('test-posthog-customer/:id')
  async getTestPosthogCustomer(@Param('id') id: string) {
    const session = randomUUID();
    return this.testsService.getTestPosthogCustomer(id, session);
  }

  @Get('test-customer-id')
  async getTestCustomerId() {
    const session = randomUUID();
    return this.testsService.getTestCustomerId(session);
  }

  @Get('any-test-customer-id')
  async getAnyTestCustomerId() {
    const session = randomUUID();
    return this.testsService.getAnyTestCustomerId(session);
  }

  @Get('audience-by-customer/:id')
  async getAudienceByCustomerId(@Param('id') id: string) {
    const session = randomUUID();
    return this.testsService.getAudienceByCustomerId(id, session);
  }

  @Get('test-recovery')
  async getTestRecovery() {
    const session = randomUUID();
    return this.testsService.getTestRecovery(session);
  }

  @Get('is-customer-in-segment/:customerId')
  async isCustomerInSegment(@Param('customerId') customerId: string) {
    const session = randomUUID();
    return this.testsService.isCustomerInSegment(customerId, session);
  }

  @Get('get-segment-size/:segmentId')
  async getSegmentSize(@Param('segmentId') segmentId: string) {
    const session = randomUUID();
    return this.testsService.getSegmentSize(segmentId, session);
  }

  @Get('get-workflow-customer-amount/:workflowId')
  async getWorkflowCustomersAmount(@Param('workflowId') workflowId: string) {
    const session = randomUUID();
    return this.testsService.getWorkflowCustomersAmount(workflowId, session);
  }
}
