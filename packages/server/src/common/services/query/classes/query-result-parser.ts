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
    else if (query.flags & QueryFlags.GetIDs) {
      return this.getFieldValues(rawResult, 'id');
    }

    return rawResult;
  }

  private getNumberValue(rawResult: any): number {
    if (Array.isArray(rawResult) &&
      rawResult.length == 1 &&
      rawResult[0].count) {
      return parseInt(rawResult[0].count);
    }

    return 0;
  }

  private getFieldValues(rawResult: any, field: string) {
    return rawResult?.map(record => record[field]);
  }
}
