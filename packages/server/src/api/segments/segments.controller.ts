import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignCustomerDTO } from './dto/assign-customer.dto';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { PutCutomersDTO } from './dto/put-customers.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentsService } from './segments.service';
import { randomUUID } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('segments')
export class SegmentsController {
  constructor(
    private segmentsService: SegmentsService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SegmentsController.name,
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
        class: SegmentsController.name,
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
        class: SegmentsController.name,
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
        class: SegmentsController.name,
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
        class: SegmentsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string
  ) {
    const session = randomUUID();

    return this.segmentsService.findAll(
      <Account>user,
      take && +take,
      skip && +skip,
      search,
      session
    );
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.findOne(<Account>user, id, session);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async create(
    @Req() { user }: Request,
    @Body() createSegmentDTO: CreateSegmentDTO
  ) {
    const session = randomUUID();

    return this.segmentsService.create(
      <Account>user,
      createSegmentDTO,
      session
    );
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateSegmentDTO: UpdateSegmentDTO
  ) {
    const session = randomUUID();

    return this.segmentsService.update(
      <Account>user,
      id,
      updateSegmentDTO,
      session
    );
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.delete(<Account>user, id, session);
  }

  @Post('/:id/duplicate')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.duplicate(<Account>user, id, session);
  }

  @Get('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getCustomers(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string
  ) {
    const session = randomUUID();

    return this.segmentsService.getCustomers(
      <Account>user,
      id,
      take && +take,
      skip && +skip,
      session
    );
  }

  @Post('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async assignCustomer(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() assignCustomerDTO: AssignCustomerDTO
  ) {
    const session = randomUUID();

    return this.segmentsService.assignCustomer(
      <Account>user,
      id,
      assignCustomerDTO.customerId,
      session
    );
  }

  @Put('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async putCustomers(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() putCutomersDTO: PutCutomersDTO
  ) {
    const session = randomUUID();

    return this.segmentsService.putCustomers(
      <Account>user,
      id,
      putCutomersDTO.customerIds,
      session
    );
  }

  @Delete('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async clearCustomers(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.segmentsService.clearCustomers(<Account>user, id, session);
  }

  @Delete('/:id/customers/:customerId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async deleteCustomer(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Param('customerId') customerId: string
  ) {
    const session = randomUUID();

    return this.segmentsService.deleteCustomer(
      <Account>user,
      id,
      customerId,
      session
    );
  }

  @Post('/:id/importcsv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(FileInterceptor('file'))
  async getCSVPeople(
    @Req() { user }: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    const session = randomUUID();

    return this.segmentsService.loadCSVToManualSegment(
      <Account>user,
      id,
      file,
      session
    );
  }

  @Get('/:id/user-in-workflows')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async checkUsedInWorkflows(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.segmentsService.checkUsedInWorkflows(
      <Account>user,
      id,
      session
    );
  }
}
