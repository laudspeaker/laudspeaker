import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import {
  Query,
  QuerySyntax,
  QueryConverter
} from './';

@Injectable()
export class QueryService {
  constructor(
    private dataSource: DataSource,
  ) {
    // super();
  }

  async executeQuery(query: Query) {
    return query.execute(this.dataSource);
  }

  async getCustomersInQuery(query: Query) {
  }





}
