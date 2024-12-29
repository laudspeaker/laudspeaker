import {
  Query,
  QueryFlags,
} from "../";

export class QueryResultParser {
  parse(rawResult: any, query: Query) {
    return this.parseResult(rawResult, query);
  }

  private parseResult(rawResult: any, query: Query) {
    if (query.flags & QueryFlags.Count) {
      return this.getNumberValue(rawResult);
    }

    return rawResult;
  }

  private getNumberValue(rawResult: any) {
    if (Array.isArray(rawResult) &&
      rawResult.length == 1 &&
      rawResult[0].count) {
      return parseInt(rawResult[0].count);
    }

    return 0;
  }
}
