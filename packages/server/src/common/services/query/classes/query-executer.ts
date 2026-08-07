import { 
  Query,
  QueryExecuterInterface,
  QueryResultParser,
  // QueryPreparerFlags,
  QuerySQL,
  QueryResult,
  QueryFlags,
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

  private async executeQuery(
    query: Query,
    dataSource: DataSource
  ) {
    const resultParser = new QueryResultParser();

    const querySQL = query.toSQL();

    const rawResult = await this.executeQueryRaw(querySQL, dataSource); 

    const result = resultParser.parse(rawResult, query);

    return result;
  }

  private async executeQueryRaw(
    queryStr: string,
    dataSource: DataSource
  ) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log(`Executing SQL: ${queryStr}`);

    const result = await queryRunner.manager.query(queryStr);

    await queryRunner.release();

    return result;
  }
}
