import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  Controller,
  Inject,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Req,
  Post,
  Query,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JourneysService } from './journeys.service';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { Journey } from './entities/journey.entity';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { randomUUID } from 'crypto';
import { UpdateJourneyLayoutDto } from './dto/update-journey-layout.dto';

@Controller('journeys')
export class JourneysController {
  constructor(
    @Inject(JourneysService)
    private readonly journeysService: JourneysService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(
    @Req() { user }: Request,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('orderBy') orderBy?: keyof Journey,
    @Query('orderType') orderType?: 'asc' | 'desc',
    @Query('showDisabled') showDisabled?: boolean,
    @Query('search') search?: string,
    @Query('filterStatuses') filterStatuses?: string
  ) {
    const session = randomUUID();
    return this.journeysService.findAll(
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
  async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.findOne(<Account>user, id, session);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Req() { user }: Request,
    @Body() createJourneyDto: CreateJourneyDto
  ) {
    const session = randomUUID();
    return await this.journeysService.create(
      <Account>user,
      createJourneyDto.name,
      session
    );
  }

  @Post('duplicate/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.duplicate(<Account>user, id, session);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateJourneyDto: UpdateJourneyDto
  ) {
    const session = randomUUID();
    return await this.journeysService.update(
      <Account>user,
      updateJourneyDto,
      session
    );
  }

  @Patch('visual-layout/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateLayout(
    @Req() { user }: Request,
    @Body() updateJourneyDto: UpdateJourneyLayoutDto
  ) {
    const session = randomUUID();
    return await this.journeysService.updateLayout(
      <Account>user,
      updateJourneyDto,
      session
    );
  }

  @Patch('pause/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async pause(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.setPaused(
      <Account>user,
      id,
      true,
      session
    );
  }

  @Patch('resume/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async resume(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.setPaused(
      <Account>user,
      id,
      false,
      session
    );
  }

  @Patch('stop/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async stop(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.stop(<Account>user, id, session);
  }

  @Patch('start/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async start(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.start(<Account>user, id, session);
  }

  @Patch('delete/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.markDeleted(<Account>user, id, session);
  }
}
