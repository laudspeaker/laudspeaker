import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
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
}
