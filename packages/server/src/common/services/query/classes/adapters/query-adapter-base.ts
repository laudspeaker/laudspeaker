import {
  Query,
  QueryContext,
  QueryConverter,
  QueryData,
  NodeFactory,
  QueryFormat,
  QueryAdapterSupportedType,
  QueryFlags,
} from "../../";

export abstract class QueryAdapterBase {
	nodeFactory = new NodeFactory();

  abstract toQuery(input: QueryAdapterSupportedType): Query;
  abstract toSQL(
    input: any,
    context?: QueryContext
  ): string;

  protected initQueryData(query: Query): QueryData {
    const data: QueryData = {
      query: query,
      context: query.context,
      customerAttributes: [],
      eventSearchCriteria: [],
      distinctEvents: new Set<string>,
      flags: QueryFlags.None,
      selectValues: [],
      tables: [],
      condition: '',
    }

    return data;
  }
}