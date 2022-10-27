import {
  ClassSerializerInterceptor,
  Controller,
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
    // if (process.env.NODE_ENV !== 'development') return;
    console.log('in import');
    let account: Account; // Account associated with the caller
    try {
      account = await this.userService.findOne(user);
      console.log('account is');
      console.log(account);
    } catch (e) {
      console.log(e);
      //return new HttpException(e, 500);
    }

    //to do will eventually need to make it so it does not take the top g
    try {
      await this.customersService.ingestPosthogPersons(
        process.env.TESTS_POSTHOG_PROJECT_ID,
        process.env.TESTS_POSTHOG_API_KEY,
        process.env.TESTS_POSTHOG_HOST_URL,
        account
      );
    } catch (e) {
      console.log(e);
    }
  }
}
