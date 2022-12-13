import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';

@Controller('segments')
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findAll(@Req() { user }: Request) {
    return this.segmentsService.findAll(<Account>user);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findOne(@Req() { user }: Request, @Param('id') id: string) {
    return this.segmentsService.findOne(<Account>user, id);
  }
}
