import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    Controller,
    Inject,
    LoggerService,
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

@Controller('jobs')
export class JobsController {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService, private readonly jobsService: JobsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    create(@Req() { user }: Request, @Body() createJobDto: CreateJobDto): Promise<Job> {
        return this.jobsService.create(<Account>user, createJobDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(@Req() { user }: Request): Promise<Job[]> {
        return this.jobsService.findAll(<Account>user);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    findOne(@Req() { user }: Request, @Param('id') id: string): Promise<Job> {
        return this.jobsService.findOneById(<Account>user, id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    update(@Req() { user }: Request, @Param('id') id: string, @Body() updateJobDto: UpdateJobDto): Promise<UpdateResult> {
        return; //this.jobsService.update(<Account>user, id, updateJobDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    remove(@Req() { user }: Request, @Param('id') id: string): Promise<void | HttpException> {
        return this.jobsService.remove(<Account>user, id);
    }
}
