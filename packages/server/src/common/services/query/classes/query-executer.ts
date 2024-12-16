import { 
  Query,
  QueryPreparer,
  QueryExecuterInterface,
  QueryResultParser,
  QueryPreparerFlags,
  QuerySQL,
  QueryResult,
} from "../";
import { DataSource, Repository } from 'typeorm';

export class QueryExecuter implements QueryExecuterInterface {
  constructor() {}

  async execute(
    query: Query,
    dataSource: DataSource
  ) {
    if (!query.isValid())
      return [];

    return this.executeQuery(query, dataSource);
  }

  async getOne(
    query: Query,
    dataSource: DataSource
  ): Promise<any> {
    if (!query.isValid())
      return undefined;

    const result = await this.executeQuery(query, dataSource);

    return result[0];
  }

  async getCount(
    query: Query,
    dataSource: DataSource
  ): Promise<number> {
    if (!query.isValid())
      return 0;

    // const result = await this.executeQuery(query, dataSource);

    const result = await this.getOne(query, dataSource);

    const count = parseInt(result?.count ?? "0");

    return count;
  }

  private async executeQuery(
    query: Query,
    dataSource: DataSource
  ) {
    const resultParser = new QueryResultParser();

    const rawResult = await this.executeQueryRaw(
      query.toSQL(),
      dataSource); 

    const result = resultParser.parse(rawResult);

    return result;
  }

  private async executeQueryRaw(
    queryStr: string,
    dataSource: DataSource
  ) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log(`FULLSQL: ${queryStr}`);

    const result = await queryRunner.manager.query(queryStr);

    await queryRunner.release();

    return result;
  }
}

