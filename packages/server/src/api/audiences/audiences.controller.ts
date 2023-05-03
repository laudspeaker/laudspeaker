import {
  UseInterceptors,
  ClassSerializerInterceptor,
  Controller,
  Logger,
  Inject,
  UseGuards,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Req,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AudiencesService } from './audiences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { randomUUID } from 'crypto';

@Controller('audiences')
export class AudiencesController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly audienceService: AudiencesService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AudiencesController.name,
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
        class: AudiencesController.name,
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
        class: AudiencesController.name,
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
        class: AudiencesController.name,
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
        class: AudiencesController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Req() { user }: Request) {
    const session = randomUUID();
    this.debug(
      `Finding Audiences for ${JSON.stringify({ id: (<Account>user).id })}`,
      this.findAll.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.audienceService.findAll(<Account>user, session);
    } catch (e) {
      this.error(e, this.findAll.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    this.debug(
      `Finding Audience ${JSON.stringify({ id: id })}`,
      this.findOne.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.audienceService.findOne(<Account>user, id, session);
    } catch (e) {
      this.error(e, this.findOne.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Post('create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createAudienceDto: CreateAudienceDto
  ) {
    const session = randomUUID();
    this.debug(
      `Creating Audience ${JSON.stringify(createAudienceDto)}`,
      this.create.name,
      session,
      (<Account>user).id
    );
    try {
      const audience = await this.audienceService.insert(
        <Account>user,
        createAudienceDto,
        session
      );
      return audience;
    } catch (e) {
      this.error(e, this.create.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateAudienceDto: UpdateAudienceDto
  ) {
    const session = randomUUID();

    this.debug(
      `Updating Audience ${JSON.stringify(updateAudienceDto)}`,
      this.update.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.audienceService.update(
        <Account>user,
        updateAudienceDto,
        session
      );
    } catch (e) {
      this.error(e, this.update.name, session, (<Account>user).id);
      throw e;
    }
  }
}
