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
  Put,
  UploadedFile,
} from '@nestjs/common';
import { Multer } from 'multer';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { AccountsService } from '../accounts/accounts.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Get('/audienceStats')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAudienceStatsCustomers(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('event') event?: string,
    @Query('audienceId') audienceId?: string
  ) {
    return this.customersService.findAudienceStatsCustomers(
      <Account>user,
      take && +take,
      skip && +skip,
      event,
      audienceId
    );
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request, @Param() { id }: { id: string }) {
    const { _id, __v, ownerId, verified, ...customer } =
      await this.customersService.findOne(<Account>user, id);
    const createdAt = new Date(parseInt(_id.slice(0, 8), 16) * 1000).getTime();
    return { ...customer, createdAt };
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  update(
    @Req() { user }: Request,
    @Param() { id }: { id: string },
    @Body() updateCustomerDto: Record<string, unknown>
  ) {
    return this.customersService.update(<Account>user, id, updateCustomerDto);
  }

  @Post('/create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createCustomerDto: CreateCustomerDto
  ) {
    const cust = await this.customersService.create(
      <Account>user,
      createCustomerDto
    );

    return cust.id;
  }

  @Get('/attributes/:resourceId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getAttributes(@Param('resourceId') resourceId: string) {
    return this.customersService.getAttributes(resourceId);
  }

  @Get('/:id/events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findCustomerEvents(
    @Req() { user }: Request,
    @Param() { id }: { id: string }
  ) {
    return this.customersService.findCustomerEvents(<Account>user, id);
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

  @Post('/importcsv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(FileInterceptor('file'))
  async getCSVPeople(
    @Req() { user }: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.customersService.loadCSV(<Account>user, file);
  }

  @Post('/delete/:custId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async deletePerson(@Param('custId') custId: string) {
    await this.customersService.removeById(custId);
  }
}
