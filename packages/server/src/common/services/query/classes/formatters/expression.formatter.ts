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
} from "../../";

export class ExpressionFormatter extends QueryFormatterBase {

  toQuery() {
    const query = this.queryFromExpression();

    return query;
  }

  queryFromExpression(): Query {
    switch(this.input.kind) {
      case QuerySyntax.LogicalExpression:
        return this.queryFromLogicalExpression(this.input as LogicalExpressionInterface);
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
