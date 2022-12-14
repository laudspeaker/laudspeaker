import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { Like } from 'typeorm';
import { SearchQueryDTO } from './dto/search-query.dto';
import { CreateSegmentDTO } from './dto/create-segment.dto';

@Controller('segments')
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findAll(@Req() { user }: Request, @Query() {searchText}: SearchQueryDTO) {
    return this.segmentsService.findAll({where:{userId:(<Account>user).id, name : Like(`%${searchText || ''}%`)},take:10});
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findOne(@Req() { user }: Request, @Param('id') id: string) {
    return this.segmentsService.findOne(<Account>user, id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async create(@Req() {user}: Request, @Body() body : CreateSegmentDTO) {
    return this.segmentsService.createSegment(body,(<Account>user).id);
  }
}
