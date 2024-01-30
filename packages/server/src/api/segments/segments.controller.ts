import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { RavenInterceptor } from 'nest-raven';
import { CountSegmentUsersSizeDTO } from './dto/size-count.dto';
import { DeleteBatchedCustomersDto } from './dto/delete-batched-customers.dto';

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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.findOne(<Account>user, id, session);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async create(
    @Req() { user }: Request,
    @Body() createSegmentDTO: CreateSegmentDTO
  ) {
    const session = randomUUID();
    //console.log("**** in save segment /n\n");
    //console.log("the segmentDTO is", JSON.stringify(createSegmentDTO, null, 2) );
    //test switch back to segmentsService.create
    /*
    return await this.segmentsService.testSegment(
      <Account>user,
      createSegmentDTO,
      session
    );
    */

    this.debug(
      `post saving segment`,
      this.create.name,
      session,
    );
   
    return await this.segmentsService.create(
      <Account>user,
      createSegmentDTO,
      session
    );
  }

  @Post('/size')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async size(
    @Req() { user }: Request,
    @Body() countSegmentUsersSizeDTO: CountSegmentUsersSizeDTO
  ) {
    const session = randomUUID();
    //console.log("**** in save segment /n\n");
    //console.log("the segmentDTO is", JSON.stringify(createSegmentDTO, null, 2) );

    this.debug(
      ` post size ${JSON.stringify(
        countSegmentUsersSizeDTO,
        null,
        2
      )}`,
      this.create.name,
      session,
    );

    return await this.segmentsService.size(
      <Account>user,
      countSegmentUsersSizeDTO,
      session
    );
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.delete(<Account>user, id, session);
  }

  @Post('/:id/duplicate')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();

    return this.segmentsService.duplicate(<Account>user, id, session);
  }

  @Get('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async getCustomers(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('orderType') orderType?: 'asc' | 'desc'
  ) {
    const session = randomUUID();

    return this.segmentsService.getCustomers(
      <Account>user,
      id,
      take && +take,
      skip && +skip,
      orderType,
      session
    );
  }

  @Post('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async clearCustomers(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.segmentsService.clearCustomers(<Account>user, id, session);
  }

  @Post('/:id/customers/delete-batch')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async deleteBatchedCustomers(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() { customerIds }: DeleteBatchedCustomersDto
  ) {
    const session = randomUUID();

    return this.segmentsService.deleteBatchedCustomers(
      <Account>user,
      id,
      customerIds,
      session
    );
  }

  @Delete('/:id/customers/:customerId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
}
