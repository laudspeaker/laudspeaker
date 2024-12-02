import { Inject, Injectable } from '@nestjs/common';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import {
  Query,
  QuerySyntax,
  QueryConverter
} from './';

@Injectable()
export class QueryService extends BaseLaudspeakerService {
  constructor() {
    super();
  }

  fromJSON(jsonQuery: Record<string, any>): Query {
    const converter = new QueryConverter(QuerySyntax.JSON, jsonQuery);

    return converter.toQuery();
  }
}
