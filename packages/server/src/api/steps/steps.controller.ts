import {
  UseInterceptors,
  ClassSerializerInterceptor,
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Req,
  Delete,
} from '@nestjs/common';
import { StepsService } from './steps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @UseInterceptors(new RavenInterceptor())
  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Req() { user }: Request) {
    const session = randomUUID();
    return await this.stepsService.findAll(<Account>user, session);
  }

  @UseInterceptors(new RavenInterceptor())
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.stepsService.findOne(
      <Account>user,
      (<Account>user).currentWorkspace,
      id,
      session
    );
  }

  @UseInterceptors(new RavenInterceptor())
  @Get('stats/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getStats(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.stepsService.getStats(<Account>user, session, id);
  }

  @UseInterceptors(new RavenInterceptor())
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Req() { user }: Request, @Body() createStepDto: CreateStepDto) {
    const session = randomUUID();
    return await this.stepsService.insert(
      <Account>user,
      (<Account>user).currentWorkspace,
      createStepDto,
      session
    );
  }

  @UseInterceptors(new RavenInterceptor())
  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(@Req() { user }: Request, @Body() updateStepDto: UpdateStepDto) {
    const session = randomUUID();
    return await this.stepsService.update(
      <Account>user,
      updateStepDto,
      session
    );
  }

  @UseInterceptors(new RavenInterceptor())
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.stepsService.delete(<Account>user, id, session);
  }
}
