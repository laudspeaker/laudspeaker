import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFilterDTO } from './dto/create-filter.dto';
import { UpdateFilterDTO } from './dto/update-filter.dto';
import { Filter } from './entities/filter.entity';
import { FilterService } from './filter.service';

@Controller('filter')
export class FilterController {
  constructor(private filterService: FilterService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async findAll(@Req() { user }: Request): Promise<Filter[]> {
    return this.filterService.findAll({
      where: {
        user: { id: (<Account>user).id },
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
  ): Promise<Filter> {
    return this.filterService.findOne(<Account>user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async create(
    @Req() { user }: Request,
    @Body() body: CreateFilterDTO
  ): Promise<Filter> {
    return this.filterService.createFilter(body, (<Account>user).id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateSegmentDTO: UpdateFilterDTO
  ): Promise<void> {
    return this.filterService.updateFilter(<Account>user, id, updateSegmentDTO);
  }
}
