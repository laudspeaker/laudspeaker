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

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Req() { user }: Request) {
    const session = randomUUID();
    return await this.stepsService.findAll(<Account>user, session);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.stepsService.findOne(<Account>user, id, session);
  }

  @Post('create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Req() { user }: Request, @Body() createStepDto: CreateStepDto) {
    const session = randomUUID();
    return await this.stepsService.insert(
      <Account>user,
      createStepDto,
      session
    );
  }

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async delete(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    return await this.stepsService.delete(<Account>user, id, session);
  }
}
