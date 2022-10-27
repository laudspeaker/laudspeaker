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
  Query,
  LoggerService,
  HttpException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { AccountsService } from '../accounts/accounts.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AccountsService)
    private readonly userService: AccountsService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string
  ) {
    return this.customersService.returnAllPeopleInfo(
      <Account>user,
      take && +take,
      skip && +skip
    );
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
    let account: Account; // Account associated with the caller
    try {
      account = await this.userService.findOne(user);
    } catch (e) {
      this.logger.error('Error:' + e);
      return new HttpException(e, 500);
    }

    //to do will eventually need to make it so it does not take the top g
    try {
      await this.customersService.ingestPosthogPersons(
        account.posthogProjectId[0],
        account.posthogApiKey[0],
        account.posthogHostUrl[0],
        account
      );
    } catch (e) {
      this.logger.error('Error:' + e);
      return new HttpException(e, 500);
    }
  }
}
