import { 
  Query,
  QueryContext,
  QueryConverterInterface,
  QuerySQL,
  QueryResult,
  QueryFormat,
  QuerySyntax,
  ExpressionInterface,
  ExpressionFormatter,
  JSONFormatter,
  PGFormatter,
} from "../";

export class QueryConverter implements QueryConverterInterface {
  private inputFormat: QueryFormat;
  private outputFormat: QueryFormat = QuerySyntax.Query;
  private input: any;
  private context: QueryContext;

  static from(
    inputFormat: QueryFormat,
    input: any,
    context: QueryContext
  ): QueryConverter {
    return new QueryConverter().from(inputFormat, input, context);
  }

  from(
    inputFormat: QueryFormat,
    input: any,
    context: QueryContext): QueryConverter {
    this.inputFormat = inputFormat;
    // this.input = input;
    // this.context = context;

    this.setInput(input);
    this.setContext(context);

    return this;
  }

  to(format: QueryFormat) {
    this.outputFormat = format;

    return this.convert();
  }

  setContext(context: QueryContext) {
    this.context = context;
  }

  setInput(input: any) {
    this.input = input;
  }

  toQuery(): Query {
    return this.to(QuerySyntax.Query) as Query;
  }

  toSQL(): string {
    return this.to(QuerySyntax.Postgres) as string;
  }

  convert() {
    const inputQuery: Query = this.convertInputToQuery();

    const output = this.convertInputQueryToOutput(inputQuery);

    return output;
  }

  private fromJSON(): Query {
    const formatter = new JSONFormatter(this.input, this.context);

    return formatter.toQuery();
  }

  private fromExpression(): Query {
    const formatter = new ExpressionFormatter(this.input, this.context);

    return formatter.toQuery();
  }

  private convertInputToQuery(): Query {

    if (!this.inputFormat)
      this.inputFormat = QuerySyntax.Query;

    if (!this.inputFormat)
      throw new Error("Query Conversion Error");
    
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
        const formatter = new PGFormatter(inputQuery, inputQuery.context);

        return formatter.process(inputQuery.expression);
    }
  }
}
