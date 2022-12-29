import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { Segment } from './entities/segment.entity';

@Controller('segments')
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findAll(
    @Req() { user }: Request,
    @Query() { searchText }: SearchQueryDTO
  ): Promise<Segment[]> {
    return this.segmentsService.findAll({
      where: {
        user: { id: (<Account>user).id },
        name: Like(`%${searchText || ''}%`),
      },
      take: 10,
    });
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findOne(
    @Req() { user }: Request,
    @Param('id') id: string
  ): Promise<Segment> {
    return this.segmentsService.findOne(<Account>user, id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async create(
    @Req() { user }: Request,
    @Body() body: CreateSegmentDTO
  ): Promise<Segment> {
    return this.segmentsService.createSegment(body, (<Account>user).id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateSegmentDTO: UpdateSegmentDTO
  ): Promise<void> {
    return this.segmentsService.updateSegment(
      <Account>user,
      id,
      updateSegmentDTO
    );
  }

  @Post('/:id/duplicate')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async duplicate(
    @Req() { user }: Request,
    @Param('id') id: string
  ): Promise<Segment> {
    return this.segmentsService.duplicateSegment(<Account>user, id);
  }
}
