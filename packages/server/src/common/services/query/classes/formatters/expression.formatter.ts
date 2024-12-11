import { QueryFormatterBase } from "../";
import {
  Query,
  QuerySyntax,
  QueryElement,
  NodeInterface,
  ExpressionInterface,
  BinaryExpressionInterface,
  LogicalExpressionInterface,
  OperatorKind,
  QueryAttributeType,
  QueryContext,
} from "../../";

export class ExpressionFormatter extends QueryFormatterBase {

  toQuery() {
    const query = this.queryFromExpression();

    return query;
  }

  queryFromExpression(): Query {
    switch(this.input.kind) {
      case QuerySyntax.LogicalExpression:
        return this.queryFromLogicalExpression(
          this.input as LogicalExpressionInterface,
          this.context);
    }
  }

  private queryFromLogicalExpression(
    node: LogicalExpressionInterface,
    context: QueryContext): Query {
    const query = new Query(context);

    if (node.operator == QuerySyntax.AndKeyword)
      query.setMatchingToAll();
    else
      query.setMatchingToAny();

    for(let expression of node.expressions)
      query.add(expression);

    return query;
  }
}
