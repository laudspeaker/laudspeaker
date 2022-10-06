import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
  Body,
  ClassSerializerInterceptor,
  Param,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Req() { user }: Request) {
    return this.customersService.returnAllPeopleInfo(<Account>user);
  }

  @Post('/create/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  create(
    @Req() { user }: Request,
    @Body() createCustomerDto: CreateCustomerDto
  ) {
    return this.customersService.create(<Account>user, createCustomerDto);
  }

  @Get('/attributes/:resourceId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getAttributes(@Param('resourceId') resourceId: string) {
    return this.customersService.getAttributes(resourceId);
  }
}
