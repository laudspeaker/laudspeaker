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
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Template } from './entities/template.entity';
@Controller('templates')
export class TemplatesController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly templatesService: TemplatesService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('orderBy') orderBy?: keyof Template,
    @Query('orderType') orderType?: 'asc' | 'desc'
  ) {
    return this.templatesService.findAll(
      <Account>user,
      take && +take,
      skip && +skip,
      orderBy,
      orderType
    );
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  create(
    @Req() { user }: Request,
    @Body() createTemplateDto: CreateTemplateDto
  ) {
    return this.templatesService.create(<Account>user, createTemplateDto);
  }

  @Get(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Req() { user }: Request, @Param('name') name: string) {
    return this.templatesService.findOne(<Account>user, name);
  }

  @Patch(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  update(
    @Req() { user }: Request,
    @Param('name') name: string,
    @Body() updateTemplateDto: UpdateTemplateDto
  ) {
    return this.templatesService.update(<Account>user, name, updateTemplateDto);
  }

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  remove(@Req() { user }: Request, @Param('name') name: string) {
    return this.templatesService.remove(<Account>user, name);
  }

  @Post(':name/duplicate')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  duplicate(@Req() { user }: Request, @Param('name') name: string) {
    return this.templatesService.duplicate(<Account>user, name);
  }
}
