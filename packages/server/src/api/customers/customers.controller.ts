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
import { diskStorage, Multer } from 'multer';
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
import { GetBulkCustomerCountDto } from './dto/get-bulk-customer-count.dto';
import { RavenInterceptor } from 'nest-raven';
import { AttributeType } from './schemas/customer-keys.schema';
import { ImportCustomersDTO } from './dto/import-customers.dto';
import { extname } from 'path';
import { UpdatePK_DTO } from './dto/update-pk.dto';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { DeleteCustomerDto } from './dto/delete-customer.dto';
import { ReadCustomerDto } from './dto/read-customer.dto';
import { ModifyAttributesDto } from './dto/modify-attributes.dto';

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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('checkInSegment') checkInSegment?: string,
    @Query('searchKey') searchKey?: string,
    @Query('searchValue') searchValue?: string,
    @Query('showFreezed') showFreezed?: string,
    @Query('orderType') orderType?: string
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
      showFreezed === 'true',
      orderType === 'asc' ? 'asc' : 'desc'
    );
  }

  @Get('/search-for-test')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async searchForTest(
    @Req() { user }: Request,
    @Query('take') take = 100,
    @Query('skip') skip = 0,
    @Query('search') search = ''
  ) {
    return await this.customersService.searchForTest(
      <Account>user,
      take,
      skip,
      search
    );
  }

  @Get('/search-for-webhook')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async searchForWebhook(
    @Req() { user }: Request,
    @Query('take') take = 100,
    @Query('skip') skip = 0,
    @Query('search') search = ''
  ) {
    return await this.customersService.searchForWebhook(
      <Account>user,
      take,
      skip,
      search
    );
  }

  @Put('/primary-key')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async updatePrimaryKey(@Req() { user }: Request, @Body() body: UpdatePK_DTO) {
    const session = randomUUID();

    await this.customersService.updatePrimaryKey(<Account>user, body, session);
  }

  @Get('/possible-attributes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPossibleAttributes(
    @Req() { user }: Request,
    @Query('key') key = '',
    @Query('type') type = null,
    @Query('isArray') isArray = null,
    @Query('removeLimit') removeLimit = null
  ) {
    const session = randomUUID();

    return await this.customersService.getPossibleAttributes(
      <Account>user,
      session,
      key,
      type,
      isArray,
      removeLimit
    );
  }

  @Get('/audienceStats')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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

  @Get('/getLastImportCSV')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getLastImportCSV(@Req() { user }: Request) {
    const session = randomUUID();
    return this.customersService.getLastImportCSV(<Account>user, session);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async findOne(@Req() { user }: Request, @Param() { id }: { id: string }) {
    const session = randomUUID();
    const {
      _id,
      __v,
      workspaceId,
      verified,
      journeys,
      journeyEnrollmentsDates,
      slackTeamId,
      posthogId,
      workflows,
      customComponents,
      previousAnonymousIds,
      ...customer
    } = await this.customersService.findOne(<Account>user, id, session);
    const createdAt = new Date(parseInt(_id.slice(0, 8), 16) * 1000).getTime();
    return { ...customer, createdAt };
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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

  // TODO: rewrite in order to pass primary key value in @Param()
  @Post('/create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async create(@Req() { user }: Request, @Body() createCustomerDto: any) {
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async upsert(
    @Req() { user }: Request,
    @Body() upsertCustomerDto: UpsertCustomerDto
  ) {
    const session = randomUUID();
    return await this.customersService.upsert(
      <{ account: Account; workspace: Workspace }>user,
      upsertCustomerDto,
      session
    );
  }

  @Post('/delete/')
  @UseGuards(ApiKeyAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async delete(
    @Req() { user }: Request,
    @Body() deleteCustomerDto: DeleteCustomerDto
  ) {
    const session = randomUUID();
    return await this.customersService.delete(
      <{ account: Account; workspace: Workspace }>user,
      deleteCustomerDto,
      session
    );
  }

  @Post('/read/')
  @UseGuards(ApiKeyAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async read(
    @Req() { user }: Request,
    @Body() readCustomerDto: ReadCustomerDto
  ) {
    const session = randomUUID();
    return await this.customersService.read(
      <{ account: Account; workspace: Workspace }>user,
      readCustomerDto,
      session
    );
  }

  @Get('/attributes/:resourceId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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

  @Post('/attributes/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async createAttribute(
    @Req() { user }: Request,
    @Body()
    {
      name,
      type,
      dateFormat,
    }: { name: string; type: AttributeType; dateFormat: unknown }
  ) {
    const session = randomUUID();
    return this.customersService.createAttribute(
      <Account>user,
      name,
      type,
      dateFormat,
      session
    );
  }

  @Post('/attributes/modify')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async modifyAttributes(
    @Req() { user }: Request,
    @Body() modifyAttributes: ModifyAttributesDto
  ) {
    return this.customersService.modifyAttributes(
      <Account>user,
      modifyAttributes
    );
  }

  @Post('/attributes/count-import-preview')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async countImportPreview(
    @Req() { user }: Request,
    @Body() body: ImportCustomersDTO
  ) {
    const session = randomUUID();
    return this.customersService.countImportPreview(
      <Account>user,
      body,
      session
    );
  }

  @Post('/attributes/start-import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async startImport(
    @Req() { user }: Request,
    @Body() body: ImportCustomersDTO
  ) {
    const session = randomUUID();
    return this.customersService.startImport(<Account>user, body, session);
  }

  @Get('/:id/events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async findCustomerEvents(
    @Req() { user }: Request,
    @Param() { id }: { id: string },
    @Query('page') page: number,
    @Query('pageSize') pageSize: number
  ) {
    const session = randomUUID();
    return this.customersService.findCustomerEvents(
      <Account>user,
      id,
      session,
      page,
      pageSize
    );
  }

  @Post('/importph')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getPostHogPersons(@Req() { user }: Request) {
    const session = randomUUID();

    let account: Account; // Account associated with the caller
    try {
      account = await this.userService.findOne(user, session);
    } catch (e) {
      return new HttpException(e, 500);
    }
    account = <Account>user;
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    //to do will eventually need to make it so it does not take the top g
    try {
      await this.customersService.ingestPosthogPersons(
        workspace.posthogProjectId[0],
        workspace.posthogApiKey[0],
        workspace.posthogHostUrl[0],
        account,
        session
      );
    } catch (e) {
      return new HttpException(e, 500);
    }
  }

  @Post('/importcsv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseInterceptors(FileInterceptor('file'))
  async getCSVPeople(
    @Req() { user }: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    const session = randomUUID();
    return this.customersService.loadCSV(<Account>user, file, session);
  }

  @Post('/uploadCSV')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: 1073741824,
      },
      storage: diskStorage({
        destination: './import-upload',
        filename(req, file, callback) {
          const name = file.originalname.split('.')[0];
          const fileExtName = extname(file.originalname);
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${randomName}-${name}${fileExtName}`);
        },
      }),
    })
  )
  async uploadCSV(
    @Req() { user }: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    const session = randomUUID();
    return this.customersService.uploadCSV(<Account>user, file, session);
  }

  @Post('/imports/delete/:fileKey')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async deleteImportFile(
    @Req() { user }: Request,
    @Param('fileKey') fileKey: string
  ) {
    const session = randomUUID();
    return this.customersService.deleteImportFile(
      <Account>user,
      fileKey,
      session
    );
  }

  @Post('/delete/:custId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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

  @Post('/count/bulk')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getBulkCustomersCountInSteps(
    @Req() { user }: Request,
    @Body() getBulkCustomerCountDto: GetBulkCustomerCountDto
  ) {
    return this.customersService.bulkCountCustomersInSteps(
      <Account>user,
      getBulkCustomerCountDto.stepIds
    );
  }

  @Get('/in-step/:stepId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getCustomersInStep(
    @Req() { user }: Request,
    @Param('stepId') stepId,
    @Query('take') take?: string,
    @Query('skip') skip?: string
  ) {
    return this.customersService.getCustomersInStep(
      <Account>user,
      stepId,
      take && +take,
      skip && +skip
    );
  }

  @Get(':custId/getJourneys')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getCustomerJourneys(
    @Req() { user }: Request,
    @Param('custId') custId: string,
    @Query('take') take: number,
    @Query('skip') skip: number
  ) {
    return this.customersService.getCustomerJourneys(
      <Account>user,
      custId,
      take,
      skip
    );
  }
}
