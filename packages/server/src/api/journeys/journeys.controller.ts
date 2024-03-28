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
  ParseUUIDPipe,
  ParseIntPipe,
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
import { RavenInterceptor } from 'nest-raven';

@Controller('journeys')
export class JourneysController {
  constructor(
    @Inject(JourneysService)
    private readonly journeysService: JourneysService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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

  @Get('tags')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getJourneysTags(@Req() { user }: Request) {
    const session = randomUUID();
    return await this.journeysService.getAllJourneyTags(<Account>user, session);
  }

  @Get('messages/:id/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async findAllMessagesSteps(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Param('type') type: string
  ) {
    const session = randomUUID();
    return await this.journeysService.findAllMessages(
      <Account>user,
      id,
      type,
      session
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.findOne(<Account>user, id, session);
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getJourneyStatistics(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('frequency') frequency?: string
  ) {
    const startDate = isNaN(+startTime) ? undefined : new Date(+startTime);
    const endDate = isNaN(+endTime) ? undefined : new Date(+endTime);

    return await this.journeysService.getJourneyStatistics(
      <Account>user,
      id,
      startDate,
      endDate,
      frequency === 'daily' ? 'daily' : 'weekly'
    );
  }

  @Get(':id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getJourneyCustomers(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortType') sortType?: string,
    @Query('filter') filter?: string
  ) {
    return await this.journeysService.getJourneyCustomers(
      <Account>user,
      id,
      isNaN(+take) ? 100 : +take,
      isNaN(+skip) ? 0 : +skip,
      search,
      sortBy,
      sortType,
      filter === 'all' || filter === 'in-progress,finished'
        ? 'all'
        : filter === 'in-progress'
        ? 'in-progress'
        : filter === 'finished'
        ? 'finished'
        : 'all'
    );
  }

  @Get(':id/changes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async getJourneyChanges(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string
  ) {
    return this.journeysService.getJourneyChanges(
      <Account>user,
      id,
      take && +take,
      skip && +skip
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async duplicate(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.duplicate(<Account>user, id, session);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
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
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async stop(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.stop(<Account>user, id, session);
  }

  @Patch('start/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async start(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.start(<Account>user, id, session);
  }

  @Patch('delete/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.journeysService.markDeleted(<Account>user, id, session);
  }
}
