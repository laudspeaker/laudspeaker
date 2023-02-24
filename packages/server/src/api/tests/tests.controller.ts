import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
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

@Controller('tests')
export class TestsController {
  constructor(@Inject(TestsService) private testsService: TestsService) {}

  @Post('posthogsynctest')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async posthogsynctest(@Req() { user }: Request) {
    return this.testsService.posthogsynctest(user);
  }

  @Get('reset-tests')
  async resetTestData() {
    return this.testsService.resetTestData();
  }

  @Get('test-verification')
  async getTestVerification() {
    return this.testsService.getTestVerification();
  }

  @Patch('test-account')
  async updateTestAccount(@Body() body: any) {
    return this.testsService.updateTestAccount(body);
  }

  @Patch('verify-test-account/:id')
  async verifyTestAccount(@Param('id') id: string) {
    return this.testsService.verifyTestAccount(id);
  }

  @Get('test-posthog-customer/:id')
  async getTestPosthogCustomer(@Param('id') id: string) {
    return this.testsService.getTestPosthogCustomer(id);
  }

  @Get('test-customer-id')
  async getTestCustomerId() {
    return this.testsService.getTestCustomerId();
  }

  @Get('any-test-customer-id')
  async getAnyTestCustomerId() {
    return this.testsService.getAnyTestCustomerId();
  }

  @Get('audience-by-customer/:id')
  async getAudienceByCustomerId(@Param('id') id: string) {
    return this.testsService.getAudienceByCustomerId(id);
  }

  @Get('test-recovery')
  async getTestRecovery() {
    return this.testsService.getTestRecovery();
  }
}
