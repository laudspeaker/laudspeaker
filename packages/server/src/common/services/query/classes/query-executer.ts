import { 
  Query,
  QueryPreparer,
  QueryResultParser,
  QueryPreparerFlags,
  QuerySQL,
  QueryResult,
} from "../";
import { DataSource, Repository } from 'typeorm';

export class QueryExecuter {
  constructor() {}

  async execute(
    query: Query,
    dataSource: DataSource
  ) {
    if (!query.isComplete())
      return [];

    const preparer = new QueryPreparer();

    return this.executeQuery(query, preparer, dataSource);
  }

  async getOne(
    query: Query,
    dataSource: DataSource
  ): Promise<any> {
    if (!query.isComplete())
      return undefined;

    const preparer = new QueryPreparer();

    // should be execution flags
    // preparer.setIsCountQuery();

    const result = await this.executeQuery(query, preparer, dataSource);

    return result[0];
  }

  async getCount(
    query: Query,
    dataSource: DataSource
  ): Promise<number> {

    if (!query.isComplete())
      return 0;

    const preparer = new QueryPreparer();

    // should be execution flags
    preparer.setIsCountQuery();

    const result = await this.executeQuery(query, preparer, dataSource);

    // const result = await this.getOne(query, dataSource);

    const count = parseInt(result[0]?.count ?? "0");

    return count;
  }

  private async executeQuery(
    query: Query,
    preparer: QueryPreparer,
    dataSource: DataSource
  ) {
    preparer.prepareQuery(query);

    const resultParser = new QueryResultParser();

    const rawResult = await this.executeQueryRaw(preparer, dataSource);

    const result = resultParser.parse(rawResult);

    return result;
  }

  private async executeQueryRaw(
    preparer: QueryPreparer,
    dataSource: DataSource
  ) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log(`FULLSQL: ${preparer.fullSQL}`);

    const result = await queryRunner.manager.query(preparer.fullSQL);

    await queryRunner.release();

    return result;
  }
}

