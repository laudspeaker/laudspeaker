import { 
  Query,
  QueryContext,
  QueryConverterInterface,
  QuerySQL,
  QueryResult,
  QueryFormat,
  QuerySyntax,
  QueryAdapterSupportedType,
  ExpressionInterface,
  ExpressionAdapter,
  QueryAdapterFactory,
  QueryData,
  QueryFlags,
} from "../";

export class QueryConverter implements QueryConverterInterface {
  private input: any;
  private inputFormat: QueryFormat;
  private outputFormat: QueryFormat;

  static from(
    input: any,
    inputFormat: QueryFormat,
  ): QueryConverter {
    const converter = new QueryConverter();

    return converter.from(input, inputFormat);
  }

  from(input: any, inputFormat: QueryFormat): QueryConverter {
    this.setInputDetails(input, inputFormat);

    return this;
  }

  fromQuery(query: Query): QueryConverter {
    return this.from(query, QuerySyntax.Query);
  }

  to(format: QueryFormat): QueryAdapterSupportedType {
    this.setOutputDetails(format);

    return this.generateOutput();
  }

  toQuery(): Query {
    return this.to(QuerySyntax.Query);
  }

  canConvert(): boolean {
    if (this.input
      && this.inputFormat
      && this.outputFormat)
      return true;

    return false;
  }

  private setInputDetails(input: any, format: QueryFormat) {
    this.input = input;
    this.inputFormat = format
  }

  private setOutputDetails(format: QueryFormat) {
    this.outputFormat = format;
  }

  private generateOutput() {
    if (!this.canConvert()) {
      throw new Error("Query is not ready to be converted");
    }

    // convert intput to Query
    const query: Query = this.convertToQuery(this.input, this.inputFormat);

    // convert query to output
    switch(this.outputFormat) {
      case QuerySyntax.Query:
        return query;
      case QuerySyntax.Expression:
        return query.expression;
      case QuerySyntax.JSON:
      case QuerySyntax.PostgreSQL:
        const adapter = QueryAdapterFactory.getAdapter(this.outputFormat);

        return adapter.toSQL(query);
      default:
        throw new Error(`Invalid output format ${this.outputFormat}`);
    }
  }

  private convertToQuery(input: QueryAdapterSupportedType, format: QueryFormat): Query {

    if (format == QuerySyntax.Query)
      return input as Query;

    const adapter = QueryAdapterFactory.getAdapter(format);

    return adapter.toQuery(input);
  }
}
