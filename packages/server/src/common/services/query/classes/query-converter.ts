import { 
  Query,
  QuerySQL,
  QueryResult,
  QueryFormat,
  QuerySyntax,
  ExpressionInterface,
  ExpressionFormatter,
  JSONFormatter,
  PGFormatter,
} from "../";

export class QueryConverter {
  private inputFormat: QueryFormat;
  private outputFormat: QueryFormat = QuerySyntax.Query;
  private input: any;
 
  constructor(inputFormat: QueryFormat, input: any) {
    this.inputFormat = inputFormat;
    this.input = input;
  }

  static from(inputFormat: QueryFormat, input: any): QueryConverter {
    return new QueryConverter(inputFormat, input);
  }

  to(format: QueryFormat) {
    this.outputFormat = format;

    return this.convert();
  }

  toQuery(): Query {
    return this.to(QuerySyntax.Query) as Query;
  }

  toSQL() {
    return this.to(QuerySyntax.Postgres);
  }

  convert() {
    const inputQuery: Query = this.convertInputToQuery();

    const output = this.convertInputQueryToOutput(inputQuery);

    return output;
  }

  private fromJSON(): Query {
    const formatter = new JSONFormatter(this.input);

    return formatter.toQuery();
  }

  private fromExpression(): Query {
    const formatter = new ExpressionFormatter(this.input);

    return formatter.toQuery();
  }

  private convertInputToQuery(): Query {
    switch(this.inputFormat) {
      case QuerySyntax.Query:
        return this.input;
      case QuerySyntax.Expression:
        return this.fromExpression();
      case QuerySyntax.JSON:
        return this.fromJSON();
    }
  }

  private convertInputQueryToOutput(inputQuery: Query) {
    switch(this.outputFormat) {
      case QuerySyntax.Query:
        return inputQuery;
      case QuerySyntax.Expression:
        return inputQuery.expression;
      case QuerySyntax.Postgres:
        const formatter = new PGFormatter(inputQuery);

        return formatter.process(inputQuery.expression);
    }
  }
}
