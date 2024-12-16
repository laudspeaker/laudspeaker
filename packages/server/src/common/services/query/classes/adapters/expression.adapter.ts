import { QueryAdapterBase } from "../";
import {
  Query,
  QuerySyntax,
  QueryElement,
  NodeInterface,
  ExpressionInterfaceType,
  BinaryExpressionInterface,
  LogicalExpressionInterface,
  OperatorKind,
  QueryAttributeType,
  QueryContext,
} from "../../";

export class ExpressionAdapter extends QueryAdapterBase {

  toQuery(input: ExpressionInterfaceType) {
    const query = this.queryFromExpression(input);

    return query;
  }

  toSQL(input: any): string {
    const query: Query = this.toQuery(input);

    return query.toSQL();
  }

  private queryFromExpression(input: ExpressionInterfaceType): Query {
    switch(input.kind) {
      case QuerySyntax.LogicalExpression:
        return this.queryFromLogicalExpression(input);
    }
  }

  private queryFromLogicalExpression(node: LogicalExpressionInterface): Query {
    const query = new Query();

    if (node.operator == QuerySyntax.AndKeyword)
      query.setMatchingToAll();
    else
      query.setMatchingToAny();

    for(let expression of node.expressions)
      query.add(expression);

    return query;
  }
}
