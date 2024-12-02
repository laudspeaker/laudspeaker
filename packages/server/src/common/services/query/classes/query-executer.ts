import { 
  Query,
  QuerySQL,
} from "../";
import { DataSource, Repository } from 'typeorm';

export class QueryExecuter {
  private dataSource: DataSource;
  private finalQuery;

  constructor() {
    // this.dataSource = new DataSource();
    this.finalQuery = {};
  }

  async execute(sql: QuerySQL): Promise<QuerySQL> {
    return this.executeQuery(sql);
  }

  async executeQuery(prepareQuery): Promise<QuerySQL> {
    // this.dataSource.manager.query();
    return new Promise<QuerySQL>(undefined);
  }
}

