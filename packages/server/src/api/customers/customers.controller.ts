import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
  Body,
  ClassSerializerInterceptor,
  Param,
  Inject,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
//import { EventsService } from "../events/events.service";
import { AccountsService } from '../accounts/accounts.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';

@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AccountsService)
    private readonly userService: AccountsService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Req() { user }: Request) {
    return this.customersService.returnAllPeopleInfo(<Account>user);
  }

  @Post('/create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  create(
    @Req() { user }: Request,
    @Body() createCustomerDto: CreateCustomerDto
  ) {
    return this.customersService.create(<Account>user, createCustomerDto);
  }

  @Get('/attributes/:resourceId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getAttributes(@Param('resourceId') resourceId: string) {
    return this.customersService.getAttributes(resourceId);
  }

  @Post('/importph')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostHogPersons(@Req() { user }: Request) {
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
        account.posthogProjectId[0],
        account.posthogApiKey[0],
        account.posthogHostUrl[0],
        account.id
      );
    } catch (e) {
      console.log(e);
    }
  }
}
