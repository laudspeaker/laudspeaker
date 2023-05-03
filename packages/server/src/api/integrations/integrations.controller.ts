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
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDBDto } from './dto/create-db.dto';
import { UpdateDBDto } from './dto/update-db.dto';
import { IntegrationsService } from './integrations.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private integrationsService: IntegrationsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: IntegrationsController.name,
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
        class: IntegrationsController.name,
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
        class: IntegrationsController.name,
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
        class: IntegrationsController.name,
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
        class: IntegrationsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getAllIntegrations(@Req() { user }: Request) {
    const session = randomUUID();

    return this.integrationsService.getAllIntegrations(user, session);
  }

  @Get('db')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getAllDatabases(@Req() { user }: Request) {
    const session = randomUUID();

    return this.integrationsService.getAllDatabases(user, session);
  }

  @Get('db/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getOneDatabase(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();
    return this.integrationsService.getOneDatabase(user, id, session);
  }

  @Post('db')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createDatabase(
    @Req() { user }: Request,
    @Body() createDBDto: CreateDBDto
  ) {
    const session = randomUUID();

    return this.integrationsService.createDatabase(user, createDBDto, session);
  }

  @Patch('/:id/pause')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async pauseIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.integrationsService.pauseIntegration(user, id, session);
  }

  @Patch('/:id/resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async resumeIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.integrationsService.resumeIntegration(user, id, session);
  }

  @Patch('db/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateDatabase(
    @Req() { user }: Request,
    @Body() updateDBDto: UpdateDBDto,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.integrationsService.updateDatabase(
      user,
      updateDBDto,
      id,
      session
    );
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async deleteIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    const session = randomUUID();

    return this.integrationsService.deleteIntegration(user, id, session);
  }

  @Post('db/review')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async reviewDB(
    @Req() { user }: Request,
    @Body() createDBDto: CreateDBDto
  ) {
    const session = randomUUID();

    return this.integrationsService.reviewDB(user, createDBDto, session);
  }
}
