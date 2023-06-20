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
  Logger,
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
import { ApiKeyAuthGuard } from '../auth/guards/apikey-auth.guard';
import { randomUUID } from 'crypto';

@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AccountsService)
    private readonly userService: AccountsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: CustomersController.name,
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
        class: CustomersController.name,
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
        class: CustomersController.name,
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
        class: CustomersController.name,
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
        class: CustomersController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('checkInSegment') checkInSegment?: string,
    @Query('searchKey') searchKey?: string,
    @Query('searchValue') searchValue?: string,
    @Query('showFreezed') showFreezed?: string
  ) {
    const session = randomUUID();

    return this.customersService.returnAllPeopleInfo(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      checkInSegment,
      searchKey,
      searchValue,
      showFreezed === 'true'
    );
  }

  @Get('/possible-attributes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPossibleAttributes(
    @Req() { user }: Request,
    @Query('key') key = '',
    @Query('type') type = null,
    @Query('isArray') isArray = null
  ) {
    const session = randomUUID();

    return await this.customersService.getPossibleAttributes(
      <Account>user,
      session,
      key,
      type,
      isArray
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
    const session = randomUUID();

    return this.customersService.findAudienceStatsCustomers(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      event,
      audienceId
    );
  }

  @Get('/stats-from-step')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getCustomersFromStepStatsByEvent(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('event') event?: string,
    @Query('stepId') stepId?: string
  ) {
    const session = randomUUID();

    return this.customersService.getCustomersFromStepStatsByEvent(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      event,
      stepId
    );
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request, @Param() { id }: { id: string }) {
    const session = randomUUID();
    const { _id, __v, ownerId, verified, ...customer } =
      await this.customersService.findOne(<Account>user, id, session);
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
    const session = randomUUID();
    return this.customersService.update(
      <Account>user,
      id,
      updateCustomerDto,
      session
    );
  }

  @Post('/create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createCustomerDto: CreateCustomerDto
  ) {
    const session = randomUUID();
    const cust = await this.customersService.create(
      <Account>user,
      createCustomerDto,
      session
    );
    return cust.id;
  }

  @Post('/upsert/')
  @UseGuards(ApiKeyAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async upsert(
    @Req() { user }: Request,
    @Body() updateCustomerDto: Record<string, unknown>
  ) {
    const session = randomUUID();
    return await this.customersService.upsert(
      <Account>user,
      updateCustomerDto,
      session
    );
  }

  @Get('/attributes/:resourceId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getAttributes(
    @Req() { user }: Request,
    @Param('resourceId') resourceId: string
  ) {
    const session = randomUUID();
    return this.customersService.getAttributes(
      <Account>user,
      resourceId,
      session
    );
  }

  @Get('/:id/events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findCustomerEvents(
    @Req() { user }: Request,
    @Param() { id }: { id: string }
  ) {
    const session = randomUUID();
    return this.customersService.findCustomerEvents(<Account>user, id, session);
  }

  @Post('/importph')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostHogPersons(@Req() { user }: Request) {
    const session = randomUUID();

    let account: Account; // Account associated with the caller
    try {
      account = await this.userService.findOne(user, session);
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
        account,
        session
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
    const session = randomUUID();
    return this.customersService.loadCSV(<Account>user, file, session);
  }

  @Post('/delete/:custId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async deletePerson(
    @Req() { user }: Request,
    @Param('custId') custId: string
  ) {
    const session = randomUUID();
    try {
      this.debug(
        `Removing customer ${JSON.stringify({ id: custId })}`,
        this.deletePerson.name,
        session,
        (<Account>user).id
      );
      await this.customersService.removeById(<Account>user, custId, session);
    } catch (e) {
      this.error(e, this.deletePerson.name, session, (<Account>user).id);
      throw e;
    }
  }
}
