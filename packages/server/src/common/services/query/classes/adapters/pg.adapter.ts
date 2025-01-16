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
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
  QueryFlags,
  ExpressionHelper,
  ExpressionWithLHSInterfaces,
  PostgresTable,
} from "../../";

export class PostgreSQLAdapter extends QueryAdapterBase {
  toQuery(): Query {
    throw new Error("Not implemented");
  }

  toSQL(input: Query) {
    return this.generateSQL(input);
  }

  private generateSQL(query: Query): string {
    const queryData = this.initQueryData(query);

    let flags: NodeFlags = NodeFlags.None;

    if (query.flags & QueryFlags.Count) {
      flags |= NodeFlags.CountQuery;
    }

    let sql = this.process(
      queryData.query.expression,
      queryData.query.context,
      flags
    );

    if (sql && query.flags & QueryFlags.Count) {
      sql = `SELECT COUNT(*)
        FROM (${sql})
        `;
    } else if (sql && query.flags & QueryFlags.InsertJourneyLocations) {
      sql = `
        INSERT INTO ${PostgresTable.JOURNEY_LOCATION}
              ("journey_id", "customer_id", "step_id", "workspace_id","moveStarted",
                "stepEntry", "journeyEntry", "stepEntryAt", "journeyEntryAt")
          SELECT
            '${query.getContextValue('journey_id')}' AS "journey_id",
            id as "customer_id",
            '${query.getContextValue('step_id')}' AS "step_id",
            '${query.getContextValue('workspace_id')}' AS "workspace_id",
            cast(extract(epoch from NOW()::date) as bigint) AS "moveStarted",
            cast(extract(epoch from NOW()::date) as bigint) AS "stepEntry",
            cast(extract(epoch from NOW()::date) as bigint) AS "journeyEntry",
            NOW() AS "stepEntryAt",
            NOW() AS "journeyEntryAt"
          FROM (${sql})
        `;
    } else if(sql) {
      sql += `ORDER BY ${query._order ?? 'id'} ${query._orderDirection ?? 'ASC'}\n`;
      if (query._limit) sql += `LIMIT ${query._limit}\n`
      if (query._offset) sql += `OFFSET ${query._offset}\n;`
    }

    return sql;
  }

  private process(
    node: NodeInterface,
    context: QueryContext,
    flags: NodeFlags = NodeFlags.None
  ) {

    if (!context.workspace_id)
      throw new Error(`workspace_id is not set, query aborted`);
    
    switch(node.kind) {
      case QuerySyntax.CustomerAttributeNode:
        return this.processAttributeNode(node as CustomerAttributeNodeInterface, flags);
      case QuerySyntax.EventNode:
        return this.processEventNode(node as EventNodeInterface, flags);
      case QuerySyntax.ValueNode:
        return this.processValueNode(node as ValueNodeInterface, flags);
      case QuerySyntax.UnaryExpression:
        return this.processUnaryExpression(node as UnaryExpressionInterface, context, flags);
      case QuerySyntax.BinaryExpression:
        return this.processBinaryExpression(node as BinaryExpressionInterface, context, flags);
      case QuerySyntax.TernaryExpression:
        return this.processTernaryExpression(node as TernaryExpressionInterface, context, flags);
      case QuerySyntax.LogicalExpression:
        return this.processLogicalExpression(node as LogicalExpressionInterface, context, flags);
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return;
      default:
        return;
        // return this.processEmptyExpression(context, flags);
    }
  }

  private processEmptyExpression(
    context: QueryContext,
    flags: NodeFlags
  ): string {
    return `
      SELECT *
      FROM ${PostgresTable.CUSTOMERS}
      WHERE workspace_id = '${context.workspace_id}'`;
    // let result = "";

    // // must return id as it could be nested
    // if (flags & NodeFlags.CountQuery)
    //   result = `SELECT COUNT(id) AS count FROM ${PostgresTable.CUSTOMERS}`;
    // else
    //   result = `SELECT id FROM ${PostgresTable.CUSTOMERS}`

    // return result;
  }

  private processUnaryExpression(
    expression: UnaryExpressionInterface,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    let result = "";
    const leftNode = expression.left as CustomerAttributeNodeInterface;

    if (expression.operator == QuerySyntax.ExistKeyword ||
      expression.operator == QuerySyntax.DoesNotExistKeyword)
      flags |= NodeFlags.UsePrefixOnly;

    let lhs = this.process(leftNode, context, flags);

    const operator = this.processOperator(expression.operator);
    switch(expression.operator) {
      case QuerySyntax.ExistKeyword:
        result = `${leftNode.prefix} ${operator} '${leftNode.attribute}'`;
        break;
      case QuerySyntax.DoesNotExistKeyword:
        result = `NOT(${leftNode.prefix} ${operator} '${leftNode.attribute}')`;
        break;
    }

    result = `SELECT id
      FROM ${PostgresTable.CUSTOMERS}
      WHERE
        (${result}) AND
        workspace_id = '${context.workspace_id}'
      `;

    return result;
  }

  private processBinaryExpression(
    expression: BinaryExpressionInterface,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    let result = "";

    if (ExpressionHelper.isCustomerAttributeExpression(expression)) {
      return this.processCustomerAttributeExpression(expression, context, flags);
    } else if (ExpressionHelper.isEventExpression(expression)) {
      return this.processEventExpression(expression, context, flags);
    } else {
      throw new Error("Invalid expression");
    }

    // const cteSQL = 
    //   `SELECT customer_id
    //     FROM ${PostgresTable.EVENTS}
    //     WHERE workspace_id = ?
    //       AND event = ?
    //       AND customer_id IS NOT NULL
    //     GROUP BY customer_id
    //     HAVING COUNT(id) >= ?`;

    // // TODO: add date conditions
    // variables.push(workspace_id, expression.left, rhs);

    // TODO:
    // allow SQL statements[]
    // statement[0] = CTE
    // statement[1] = select *
    // this.intermediateQuery.cte.push({
    //   name: "event_counts",
    //   sql: cteSQL,
    //   variables: variables
    // });


    return result;
  }

  private processTernaryExpression(
    expression: TernaryExpressionInterface,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    throw new Error("Not implemented");
  }

  private processLogicalExpression(
    expression: LogicalExpressionInterface,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    let result = "";
    let elementSQL = "";

    const expressions = expression.expressions;

    if (expressions.length == 0)
      return this.processEmptyExpression(context, flags);

    const needsParens = expressions.length > 1;

    const operator = expression.operator == QuerySyntax.AndKeyword ?
                QuerySyntax.IntersectKeyword :
                QuerySyntax.UnionKeyword;

    for(let i = 0; i < expressions.length; i++) {
      elementSQL = this.process(expressions[i], context, flags);

      if (needsParens)
        elementSQL = `(${elementSQL})`;

      if( i > 0 )
        result += ` ${operator.toString()} `;

      result += elementSQL;
    }

    return result;
  }

  private processCustomerAttributeExpression(
    expression: ExpressionWithLHSInterfaces,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    if (expression.operator == QuerySyntax.ContainKeyword ||
      expression.operator == QuerySyntax.DoesNotContainKeyword)
      flags |= NodeFlags.AddPercentToken;

    let sql = "";

    switch (expression.kind) {
      case QuerySyntax.UnaryExpression:
        sql = this.processUnaryExpression(expression, context, flags);
        break;
      case QuerySyntax.BinaryExpression:
        let lhs = this.process(expression.left, context, flags);
        let rhs = this.process( (expression as BinaryExpressionInterface).right, context, flags);

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

        const operator = this.processOperator(expression.operator);

        sql = `${lhs} ${operator} ${rhs}`;
        break;
      default:
        throw new Error("Invalid Expression");
    }

    const result = `
    SELECT id
    FROM ${PostgresTable.CUSTOMERS}
    WHERE
      (${sql}) AND
      workspace_id = '${context.workspace_id}'
    `;

    return result;
  }

  private processEventExpression(
    expression: ExpressionWithLHSInterfaces,
    context: QueryContext,
    flags: NodeFlags
  ): string {
    let result = "";
    const cteName = "event_counts";

    let lhs, rhs;

    switch (expression.operator) {
      case QuerySyntax.HasPerformedKeyword:
        let lhs = this.process(expression.left, context, flags);
        let rhs = this.process(expression.right, context, flags);

        result = `
          WITH ${cteName} AS (
            SELECT customer_id
            FROM ${PostgresTable.EVENTS}
            WHERE
              workspace_id = '${context.workspace_id}' AND
              event = '${lhs}' AND
              customer_id IS NOT NULL
            GROUP BY customer_id
            HAVING COUNT(*) >= ${rhs}
          )
          select customer_id AS id FROM ${cteName}
          `;
        break;
      case QuerySyntax.HasNotPerformedKeyword:
        break;
      default:
        throw new Error("Invalid expression");
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
        break;
      default:
        result = value;
        break;
    }

    return result;
  }
}