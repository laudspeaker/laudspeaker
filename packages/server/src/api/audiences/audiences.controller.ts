import {
  UseInterceptors,
  ClassSerializerInterceptor,
  Controller,
  LoggerService,
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
import { AddTemplateDto } from './dto/add-template.dto';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';

@Controller('audiences')
export class AudiencesController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly audienceService: AudiencesService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Req() { user }: Request) {
    return this.audienceService.findAll(<Account>user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Req() { user }: Request, @Param('id') id: string) {
    return this.audienceService.findOne(<Account>user, id);
  }

  @Post('create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createAudienceDto: CreateAudienceDto
  ) {
    const audience = await this.audienceService.insert(
      <Account>user,
      createAudienceDto
    );
    return audience;
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateAudienceDto: UpdateAudienceDto
  ) {
    return await this.audienceService.update(<Account>user, updateAudienceDto);
  }
}
