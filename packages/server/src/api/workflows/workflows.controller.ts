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
  Req,
  Post,
  Query,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WorkflowsService } from './workflows.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { WorkflowStatusUpdateDTO } from './dto/workflow-status-update.dto';
import { Workflow } from './entities/workflow.entity';
import { DeleteWorkflowDto } from './dto/delete-flow.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { randomUUID } from 'crypto';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly workflowsService: WorkflowsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WorkflowsController.name,
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
        class: WorkflowsController.name,
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
        class: WorkflowsController.name,
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
        class: WorkflowsController.name,
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
        class: WorkflowsController.name,
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
    @Query('orderBy') orderBy?: keyof Workflow,
    @Query('orderType') orderType?: 'asc' | 'desc',
    @Query('showDisabled') showDisabled?: boolean,
    @Query('search') search?: string,
    @Query('filterStatuses') filterStatuses?: string
  ) {
    const session = randomUUID();
    return this.workflowsService.findAll(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      orderBy,
      orderType,
      showDisabled,
      search,
      filterStatuses
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Query('needsStats') needsStats: boolean
  ) {
    const session = randomUUID();
    return await this.workflowsService.findOne(
      <Account>user,
      id,
      needsStats,
      session
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createWorkflowDto: CreateWorkflowDto
  ) {
    const session = randomUUID();
    return await this.workflowsService.create(
      <Account>user,
      createWorkflowDto.name,
      session
    );
  }

  @Patch('pause')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async pause(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    const session = randomUUID();
    return await this.workflowsService.setPaused(
      <Account>user,
      id,
      true,
      session
    );
  }

  @Patch('resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async resume(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    const session = randomUUID();
    return await this.workflowsService.setPaused(
      <Account>user,
      id,
      false,
      session
    );
  }

  @Patch('stop')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async stop(
    @Req() { user }: Request,
    @Body() { id }: WorkflowStatusUpdateDTO
  ) {
    const session = randomUUID();
    return await this.workflowsService.setStopped(
      <Account>user,
      id,
      true,
      session
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateWorkflowDto: UpdateWorkflowDto
  ) {
    const session = randomUUID();
    return await this.workflowsService.update(
      <Account>user,
      updateWorkflowDto,
      session
    );
  }

  @Post('duplicate/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.workflowsService.duplicate(<Account>user, id, session);
  }

  @Get('start/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async start(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    try {
      const res = await this.workflowsService.start(<Account>user, id, session);
      return Promise.resolve(res);
    } catch (err) {
      this.logger.error(
        `workflows.controller.ts:WorkflowsController.start: Error: ${err}`
      );
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
    const session = randomUUID();
    try {
      const res = await this.workflowsService.start(
        <Account>user,
        startWorkflowDto.id,
        session
      );
      return Promise.resolve(res);
    } catch (err) {
      this.logger.error(
        `workflows.controller.ts:WorkflowsController.startPatch: Error: ${err}`
      );
      return Promise.reject(err);
    }
  }

  @Post('delete')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async delete(@Body() deleteWorkflowDto: DeleteWorkflowDto) {
    const session = randomUUID();
    return await this.workflowsService.markFlowDeleted(
      deleteWorkflowDto.workflowId,
      session
    );
  }

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async remove(@Req() { user }: Request, @Param('name') name: string) {
    const session = randomUUID();
    return this.workflowsService.remove(<Account>user, name, session);
  }
}
