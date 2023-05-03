import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  Controller,
  Inject,
  Logger,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  Req,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Job } from './entities/job.entity';
import { UpdateResult } from 'typeorm';
import { randomUUID } from 'crypto';

@Controller('jobs')
export class JobsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly jobsService: JobsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: JobsController.name,
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
        class: JobsController.name,
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
        class: JobsController.name,
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
        class: JobsController.name,
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
        class: JobsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  create(
    @Req() { user }: Request,
    @Body() createJobDto: CreateJobDto
  ): Promise<Job> {
    const session = randomUUID();
    return this.jobsService.create(<Account>user, createJobDto, session);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Req() { user }: Request): Promise<Job[]> {
    const session = randomUUID();
    return this.jobsService.findAll(<Account>user, session);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Req() { user }: Request, @Param('id') id: string): Promise<Job> {
    const session = randomUUID();
    return this.jobsService.findOneById(<Account>user, id, session);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto
  ): Promise<UpdateResult> {
    const session = randomUUID();
    return; //this.jobsService.update(<Account>user, id, updateJobDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  remove(
    @Req() { user }: Request,
    @Param('id') id: string
  ): Promise<void | HttpException> {
    const session = randomUUID();
    return this.jobsService.remove(<Account>user, id, session);
  }
}
