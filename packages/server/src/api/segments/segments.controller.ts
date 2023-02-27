import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignCustomerDTO } from './dto/assign-customer.dto';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { PutCutomersDTO } from './dto/put-customers.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentsService } from './segments.service';

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

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async create(
    @Req() { user }: Request,
    @Body() createSegmentDTO: CreateSegmentDTO
  ) {
    return this.segmentsService.create(<Account>user, createSegmentDTO);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async update(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() updateSegmentDTO: UpdateSegmentDTO
  ) {
    return this.segmentsService.update(<Account>user, id, updateSegmentDTO);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async delete(@Req() { user }: Request, @Param('id') id: string) {
    return this.segmentsService.delete(<Account>user, id);
  }

  @Get('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getCustomers(@Req() { user }: Request, @Param('id') id: string) {
    return this.segmentsService.getCustomers(<Account>user, id);
  }

  @Post('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async assignCustomer(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() assignCustomerDTO: AssignCustomerDTO
  ) {
    return this.segmentsService.assignCustomer(
      <Account>user,
      id,
      assignCustomerDTO.customerId
    );
  }

  @Put('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async putCustomers(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Body() putCutomersDTO: PutCutomersDTO
  ) {
    return this.segmentsService.putCustomers(
      <Account>user,
      id,
      putCutomersDTO.customerIds
    );
  }

  @Delete('/:id/customers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async clearCustomers(
    @Req() { user }: Request,
    @Param('id') id: string
  ) {
    return this.segmentsService.clearCustomers(<Account>user, id);
  }

  @Delete('/:id/customers/:customerId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async deleteCustomer(
    @Req() { user }: Request,
    @Param('id') id: string,
    @Param('customerId') customerId: string
  ) {
    return this.segmentsService.deleteCustomer(<Account>user, id, customerId);
  }
}
