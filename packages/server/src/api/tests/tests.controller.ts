import {
  ClassSerializerInterceptor,
  Controller,
  HttpException,
  Inject,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CustomersService } from '../customers/customers.service';

@Controller('tests')
export class TestsController {
  constructor(
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AccountsService)
    private userService: AccountsService
  ) {}

  @Post('posthogsynctest')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async posthogsynctest(@Req() { user }: Request) {
    if (process.env.NODE_ENV !== 'development') return;

    const account = await this.userService.findOne(user);

    await this.customersService.ingestPosthogPersons(
      process.env.TESTS_POSTHOG_PROJECT_ID,
      process.env.TESTS_POSTHOG_API_KEY,
      process.env.TESTS_POSTHOG_HOST_URL,
      account
    );
  }
}
