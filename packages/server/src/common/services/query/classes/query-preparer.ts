import {
  Query,
  QuerySyntax,
  QuerySQL,
  QueryData,
  QueryPreparerFlags,
  QueryPreparerInterface,
  NodeInterface,
  AttributeNodeInterface,
  EventNodeInterface,
  ValueNodeInterface,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  LogicalExpressionInterface,
  ExpressionHelper,
  ExpressionInterfaceTypes,
  ExpressionInterface,
} from "../";

export class QueryPreparer implements QueryPreparerInterface {
  query: Query;
  queryData: QueryData;
  finalQuery: QuerySQL;
  fullSQL: string;

  flags: QueryPreparerFlags = QueryPreparerFlags.None;

  // const statements: SQLStatements[] = [];
  setIsCountQuery() {
    this.flags |= QueryPreparerFlags.IsCountQuery;
  }

  prepareQuery(query: Query) {
    this.query = query;

    this.reset();

    this.traverseTree(this.query.expression);
    this.generateFinalQuery();
    this.generateFullSQL();
  }

  private reset() {
    this.queryData = {
      customerAttributes: [],
      eventSearchCriteria: [],
      allEventNames: new Set<string>(),
      cte: [],
      tables: [],
    };

    this.finalQuery = {
      select: [],
      from: [],
      join: [],
      where: [],
      order: [],
    };

    this.fullSQL = "";
  }

  private generateFinalQuery() {
    this.generateSelect();
    this.generateFrom();
    this.generateWhere();
    this.generateCTE();
  }

  private generateSelect() {
    if(this.flags & QueryPreparerFlags.IsCountQuery) {
      this.finalQuery.select.push("COUNT(id) as count");
    } else {
      this.finalQuery.select = this.query.selectParams;
    }
  }

  private generateFrom() {
    if (this.queryData.customerAttributes.length > 0) {
      this.finalQuery.from.push("customer");
    }

    if (this.queryData.allEventNames.size > 0) {
      this.finalQuery.from.push("events");
    }
  }

  private generateWhere() {
    this.finalQuery.where.push(this.query.toSQL());
  }

  private generateCTE() {
    if (this.queryData.allEventNames.size == 0)
      return;

    const distinctEventNamesCount = this.queryData.allEventNames.size;
    const eventSearchCriteriaCount = this.queryData.eventSearchCriteria.length;

    // we need to find out if the CTE will have a HAVING clause or not
    let cteIncludesHavingClause = false;

    // if there is only one expression searching for event, include
    // the HAVING clause in the CTE
    if (distinctEventNamesCount == 1 && eventSearchCriteriaCount == 1 ) {
      cteIncludesHavingClause = true;
    }

    for (const searchCriteria of this.queryData.eventSearchCriteria) {
      if (cteIncludesHavingClause) {
        this.queryData.cte.push({
          sql: `SELECT customer_id
                FROM events
                WHERE workspace_id = ?
                  AND event = ?
                  AND customer_id IS NOT NULL
                GROUP BY customer_id
                HAVING COUNT(id) >= ?`,
          name: 'event_counts',
          variables: [this.query.context?.externalData?.workspace_id,
            searchCriteria.event,
            searchCriteria.count],
        });
      }
    }
  }

  private generateFullSQL() {
    const sqlStr = `
      SELECT ${this.finalQuery.select.join(",")}
      FROM ${this.finalQuery.from.join(",")}
      WHERE ${this.finalQuery.where.join(" AND ")}`;
    // TODO: USE ANDKeyword OrKeyword
    this.fullSQL = sqlStr;
  }

  private processAttributeNode(node: AttributeNodeInterface) {
    this.queryData.customerAttributes.push(node.attribute);
  }

  private processEventNode(node: EventNodeInterface, parent: NodeInterface | undefined = undefined) {
    let count;

    // const typedParent: BinaryExpressionInterface = ExpressionHelper.getTypedExpression(parent as BinaryExpressionInterface);

    // if (typedParent?.right?.kind == QuerySyntax.ValueNode)
    //   count = this.traverseTree(typedParent.right) ?? 0;

    if (parent.kind == QuerySyntax.BinaryExpression) {
      count = this.traverseTree( (parent as BinaryExpressionInterface).right);
      // count = parent.right?.kind == QuerySyntax.ValueNode ? 
    }
    this.queryData.eventSearchCriteria.push({
      event: node.event,
      count: count,
    });

    this.queryData.allEventNames.add(node.event);
  }

  private processValueNode(node: ValueNodeInterface) {
    return node.value;
  }

  private traverseTree(node: NodeInterface, parent: NodeInterface | undefined = undefined) {
    if(!node)
      return undefined;

    switch(node.kind) {
      case QuerySyntax.AttributeNode:
        this.processAttributeNode(node as AttributeNodeInterface);
        break;
      case QuerySyntax.EventNode:
        return this.processEventNode(node as EventNodeInterface, parent);
      case QuerySyntax.ValueNode:
        return this.processValueNode(node as ValueNodeInterface);
      case QuerySyntax.UnaryExpression:
        return this.traverseTree( (node as UnaryExpressionInterface).left, node);
      case QuerySyntax.BinaryExpression:
        this.traverseTree( (node as BinaryExpressionInterface).left, node);
        this.traverseTree( (node as BinaryExpressionInterface).right, node);
        break;
      case QuerySyntax.TernaryExpression:
        this.traverseTree( (node as TernaryExpressionInterface).left, node);
        this.traverseTree( (node as TernaryExpressionInterface).middle, node);
        this.traverseTree( (node as TernaryExpressionInterface).right, node);
        break;
      case QuerySyntax.LogicalExpression:
        for(let expression of (node as LogicalExpressionInterface).expressions) {
          this.traverseTree(expression, node);
        }
        break;
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return;
    }
  }
}

