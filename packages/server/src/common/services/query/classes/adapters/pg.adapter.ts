import { QueryAdapterBase } from "../";
import {
  CustomerAttributeNodeInterface,
  BinaryExpressionInterface,
  EventNodeInterface,
  ExpressionInterface,
  LogicalExpressionInterface,
  NodeFlags,
  NodeInterface,
  OperatorKind,
  Query,
  QuerySyntax,
  QueryContext,
  // QueryData,
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
} from "../../";

export class PostgreSQLAdapter extends QueryAdapterBase {

  toQuery(): Query {
    throw new Error("Not implmeneted");
  }

  toSQL(input: Query) {
    const queryData = this.initQueryData(input);

    return this.generateSQL(queryData);
  }

  private generateSQL(queryData: any): string {
    const sql = this.process(queryData.query.expression);

    return sql;
  }

  private process(node: NodeInterface, flags: NodeFlags = NodeFlags.None) {
    switch(node.kind) {
      case QuerySyntax.CustomerAttributeNode:
        return this.processAttributeNode(node as CustomerAttributeNodeInterface, flags);
      case QuerySyntax.EventNode:
        return this.processEventNode(node as EventNodeInterface, flags);
      case QuerySyntax.ValueNode:
        return this.processValueNode(node as ValueNodeInterface, flags);
      case QuerySyntax.UnaryExpression:
        return this.processUnaryExpression(node as UnaryExpressionInterface, flags)
      case QuerySyntax.BinaryExpression:
        return this.processBinaryExpression(node as BinaryExpressionInterface, flags)
      case QuerySyntax.TernaryExpression:
        return this.processTernaryExpression(node as TernaryExpressionInterface, flags)
      case QuerySyntax.LogicalExpression:
        return this.processLogicalExpression(node as LogicalExpressionInterface, flags)
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return;
    }
  }

  private processUnaryExpression(expression: UnaryExpressionInterface, flags: NodeFlags): string {
    let result = "";
    const leftNode = expression.left as CustomerAttributeNodeInterface;

    if (expression.operator == QuerySyntax.ExistKeyword ||
      expression.operator == QuerySyntax.DoesNotExistKeyword)
      flags |= NodeFlags.UsePrefixOnly;

    let lhs = this.process(leftNode, flags);

    const operator = this.processOperator(expression.operator);
    switch(expression.operator) {
      case QuerySyntax.ExistKeyword:
        result = `${leftNode.prefix} ${operator} '${leftNode.attribute}'`;
        break;
      case QuerySyntax.DoesNotExistKeyword:
        result = `NOT(${leftNode.prefix} ${operator} '${leftNode.attribute}')`;
        break;
    }

    return result;
  }

  private processBinaryExpression(expression: BinaryExpressionInterface, flags: NodeFlags): string {
    let result = "";

    if (expression.operator == QuerySyntax.ContainKeyword ||
      expression.operator == QuerySyntax.DoesNotContainKeyword)
      flags |= NodeFlags.AddPercentToken;

    let lhs = this.process(expression.left, flags);
    let rhs = this.process(expression.right, flags);

    let needParensLHS = false;
    let needParensRHS = false;

    if (expression.operator == QuerySyntax.AndKeyword ||
          expression.operator == QuerySyntax.OrKeyword) {
      needParensLHS = true;
      needParensRHS = true;
    }

    if (needParensLHS)
      lhs = `(${lhs})`;
    if (needParensRHS)
      rhs = `(${rhs})`;

    const cteName = "event_counts";
    const variables: any[] = [];

    const workspace_id = "";

    const cteSQL = 
      `SELECT customer_id
        FROM events
        WHERE workspace_id = ?
          AND event = ?
          AND customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING COUNT(id) >= ?`;

    // TODO: add date conditions
    variables.push(workspace_id, expression.left, rhs);

    // TODO:
    // allow SQL statements[]
    // statement[0] = CTE
    // statement[1] = select *
    // this.intermediateQuery.cte.push({
    //   name: "event_counts",
    //   sql: cteSQL,
    //   variables: variables
    // });
    switch (expression.operator) {
      case QuerySyntax.HasPerformedKeyword:
        let sql = 
          `SELECT customer.id
            FROM event_counts
            INNER JOIN customer ON customer.id = event_counts.customer_id;`;

        const fullSQL = `${cteSQL}
          ${sql}`;

        break;
      case QuerySyntax.HasNotPerformedKeyword:
        break;
      default:
        break;
    }

    const operator = this.processOperator(expression.operator);

    result = `${lhs} ${operator} ${rhs}`;

    return result;
  }

  private processTernaryExpression(expression: TernaryExpressionInterface, flags: NodeFlags): string {
    throw new Error("Not implmeneted");
  }

  private processLogicalExpression(expression: LogicalExpressionInterface, flags: NodeFlags): string {
    let result = "";
    let elementSQL = "";

    const expressions = expression.expressions;

    const needsParens = expressions.length > 1;
    const operator = expression.operator.toString();

    for(let i = 0; i < expressions.length; i++) {
      elementSQL = this.process(expressions[i]);

      if (needsParens)
        elementSQL = `(${elementSQL})`;

      if( i > 0 )
        result += ` ${operator} `;

      result += elementSQL;
    }

    return result;
  }
 
  private processOperator(operator: OperatorKind): string {
    switch(operator) {
      case QuerySyntax.ContainKeyword:
        return QuerySyntax.LikeKeyword;
      case QuerySyntax.DoesNotContainKeyword:
        return `${QuerySyntax.NotKeyword} ${QuerySyntax.LikeKeyword}`;
      case QuerySyntax.ExistKeyword:
      case QuerySyntax.DoesNotExistKeyword:
        return '?';
      default:
        return operator.toString();
    }
  }

  private processAttributeNode(node: CustomerAttributeNodeInterface, flags: NodeFlags) {
    let attribute = node.attribute.toString();
    let castingPrefix, castingSuffix
    let accessorToken;

    if (node.prefix && node.prefix.length > 0) {
      let accessorToken = QuerySyntax.EntityAccessorTextToken;
      let castingSuffix = undefined;
      
      switch(node.type) {
        case QuerySyntax.StringKeyword:
          break;
        case QuerySyntax.NumberKeyword:
          castingSuffix = 'NUMERIC';
            break;
        case QuerySyntax.BooleanKeyword:
          castingSuffix = 'BOOL';
            break;
        case QuerySyntax.EmailKeyword:
            break;
        case QuerySyntax.DateKeyword:
          castingPrefix = "to_date";
            break;
        case QuerySyntax.DateTimeKeyword:
          castingPrefix = "to_timestamp";
            break;
        case QuerySyntax.ArrayKeyword:
          accessorToken = QuerySyntax.EntityAccessorJSONBToken;
            break;
        case QuerySyntax.ObjectKeyword:
          accessorToken = QuerySyntax.EntityAccessorJSONBToken;
            break;
      }

      attribute = `${node.prefix.toString()}${accessorToken}'${attribute}'`;

      if (castingPrefix) {
        attribute = `${castingPrefix}(${attribute})`;
      }
      if (castingSuffix) {
        attribute = `(${attribute})::${castingSuffix}`;
      }
    }

    return attribute;
  }

  private processEventNode(node: EventNodeInterface, flags: NodeFlags) {
    let event = node.event.toString();

    return event;
  }

  private processValueNode(node: ValueNodeInterface, flags: NodeFlags) {
    const value = node.value.toString();
    let result: string = "";

    // | QuerySyntax.StringKeyword
    // | QuerySyntax.NumberKeyword
    // | QuerySyntax.BooleanKeyword
    // | QuerySyntax.EmailKeyword
    // | QuerySyntax.DateKeyword
    // | QuerySyntax.DateTimeKeyword
    // | QuerySyntax.ArrayKeyword
    // | QuerySyntax.ObjectKeyword;

    // todo: sanitize the values for SQL
    switch(node.type) {
      case QuerySyntax.StringKeyword:
      case QuerySyntax.EmailKeyword:
        if ((flags & NodeFlags.AddPercentToken) == NodeFlags.AddPercentToken)
          result = `'%${value}%'`;
        else
          result = `'${value}'`;
        break;
      case QuerySyntax.NumberKeyword:
        result = `${value}`;
        break;
      case QuerySyntax.BooleanKeyword:
        result = value.toUpperCase();
      default:
        break;
    }

    return result;
  }
}