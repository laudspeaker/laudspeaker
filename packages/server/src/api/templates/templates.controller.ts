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
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Template, TemplateType } from './entities/template.entity';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';

@Controller('templates')
export class TemplatesController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly templatesService: TemplatesService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: TemplatesController.name,
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
        class: TemplatesController.name,
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
        class: TemplatesController.name,
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
        class: TemplatesController.name,
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
        class: TemplatesController.name,
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
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: keyof Template,
    @Query('orderType') orderType?: 'asc' | 'desc',
    @Query('showDeleted') showDeleted?: boolean,
    @Query('type') type?: TemplateType | TemplateType[]
  ): Promise<{ data: Template[]; totalPages: number }> {
    const session = randomUUID();
    return this.templatesService.findAll(
      <Account>user,
      session,
      take && +take,
      skip && +skip,
      search,
      orderBy,
      orderType,
      showDeleted,
      type
    );
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  create(
    @Req() { user }: Request,
    @Body() createTemplateDto: CreateTemplateDto
  ) {
    const session = randomUUID();
    return this.templatesService.create(
      <Account>user,
      createTemplateDto,
      session
    );
  }

  @Get(':id/usedInJourneys')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  findUsedInJourneys(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return this.templatesService.findUsedInJourneys(<Account>user, id, session);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Req() { user }: Request, @Param('id') id: string) {
    return this.templatesService.findOneById(<Account>user, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto
  ) {
    const session = randomUUID();
    return this.templatesService.update(
      <Account>user,
      id,
      updateTemplateDto,
      session
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  remove(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return this.templatesService.remove(<Account>user, id, session);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return this.templatesService.duplicate(<Account>user, id, session);
  }

  @Post('/test-webhook')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  testWebhookTemplate(@Body() testWebhookDto: TestWebhookDto) {
    const session = randomUUID();
    return this.templatesService.testWebhookTemplate(testWebhookDto, session);
  }
}
