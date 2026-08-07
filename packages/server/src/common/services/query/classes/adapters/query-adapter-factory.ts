import {
  Query,
  QueryFormat,
  QuerySyntax,
  ExpressionAdapter,
  JSONAdapter,
  PostgreSQLAdapter,
} from "../../";

export class QueryAdapterFactory {
  static getAdapter(format: QueryFormat) {
    switch(format) {
      case QuerySyntax.Expression:
        return new ExpressionAdapter();
      case QuerySyntax.JSON:
        return new JSONAdapter();
      case QuerySyntax.PostgreSQL:
        return new PostgreSQLAdapter();
      default:
        throw new Error("Query Adapter Error");
    }
  }
}