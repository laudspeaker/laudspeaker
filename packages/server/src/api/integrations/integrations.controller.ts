import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
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

@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getAllIntegrations(@Req() { user }: Request) {
    return this.integrationsService.getAllIntegrations(user);
  }

  @Get('db')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getAllDatabases(@Req() { user }: Request) {
    return this.integrationsService.getAllDatabases(user);
  }

  @Get('db/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getOneDatabase(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    console.log(id);
    return this.integrationsService.getOneDatabase(user, id);
  }

  @Post('db')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async createDatabase(
    @Req() { user }: Request,
    @Body() createDBDto: CreateDBDto
  ) {
    return this.integrationsService.createDatabase(user, createDBDto);
  }

  @Patch('/:id/pause')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async pauseIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    return this.integrationsService.pauseIntegration(user, id);
  }

  @Patch('/:id/resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async resumeIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    return this.integrationsService.resumeIntegration(user, id);
  }

  @Patch('db/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateDatabase(
    @Req() { user }: Request,
    @Body() updateDBDto: UpdateDBDto,
    @Param('id') id: string
  ) {
    return this.integrationsService.updateDatabase(user, updateDBDto, id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async deleteIntegration(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    return this.integrationsService.deleteIntegration(user, id);
  }

  @Post('db/review')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async reviewDB(
    @Req() { user }: Request,
    @Body() createDBDto: CreateDBDto
  ) {
    return this.integrationsService.reviewDB(user, createDBDto);
  }
}
