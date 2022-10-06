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
  Req,
  Query,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WorkflowsService } from './workflows.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { WorkflowStatusUpdateDTO } from './dto/workflow-status-update.dto';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly workflowsService: WorkflowsService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Req() { user }: Request) {
    return this.workflowsService.findAll(<Account>user);
  }

  @Get(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(
    @Req() { user }: Request,
    @Param('name') name: string,
    @Query('needsStats') needsStats: boolean
  ) {
    return await this.workflowsService.findOne(<Account>user, name, needsStats);
  }

  @Patch('pause')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async pause(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    return await this.workflowsService.setPaused(<Account>user, id, true);
  }

  @Patch('resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async resume(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    return await this.workflowsService.setPaused(<Account>user, id, false);
  }

  @Patch('stop')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async stop(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    return await this.workflowsService.setStopped(<Account>user, id, true);
  }

  @Patch(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateWorkflowDto: UpdateWorkflowDto
  ) {
    return await this.workflowsService.update(<Account>user, updateWorkflowDto);
  }

  @Get('start/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async start(@Req() { user }: Request, @Param('id') id: string) {
    try {
      const res = await this.workflowsService.start(<Account>user, id);
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async startPatch(
    @Req() { user }: Request,
    @Body() startWorkflowDto: StartWorkflowDto
  ) {
    try {
      const res = await this.workflowsService.start(
        <Account>user,
        startWorkflowDto.id
      );
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  remove(@Req() { user }: Request, @Param('name') name: string) {
    return this.workflowsService.remove(<Account>user, name);
  }
}
