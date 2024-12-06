import {
  Query,
  QuerySyntax,
  QuerySQL,
  QueryIntermediate,
  QueryPreparerFlags,
  NodeInterface,
  AttributeNodeInterface,
  EventNodeInterface,
  ValueNodeInterface,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  LogicalExpressionInterface,
} from "../";

export class QueryPreparer {
  query: Query;
  intermediateQuery: QueryIntermediate;
  finalQuery: QuerySQL;
  fullSQL: string;

  flags: QueryPreparerFlags = QueryPreparerFlags.None;

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
    this.intermediateQuery = {
      customerAttributes: [],
      eventNames: [],
      eventAttributes: [],
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
  }

  private generateSelect() {
    if(this.flags & QueryPreparerFlags.IsCountQuery) {
      this.finalQuery.select.push("COUNT(*) as count");
    } else {
      this.finalQuery.select = this.query.selectParams;
    }
  }

  private generateFrom() {
    if (this.intermediateQuery.customerAttributes.length > 0) {
      this.finalQuery.from.push("customer");
    }

    if (this.intermediateQuery.eventNames.length > 0) {
      this.finalQuery.from.push("events");
    }
  }

  private generateWhere() {
    this.finalQuery.where.push(this.query.toSQL());
  }

  private generateFullSQL() {
    const sqlStr = `
      SELECT ${this.finalQuery.select.join(",")}
      FROM ${this.finalQuery.from.join(",")}
      WHERE ${this.finalQuery.where.join(" AND ")}`;

    this.fullSQL = sqlStr;
  }

  private processAttributeNode(node: AttributeNodeInterface) {
    this.intermediateQuery.customerAttributes.push(node.attribute);
  }

  private processEventNode(node: EventNodeInterface) {
    this.intermediateQuery.customerAttributes.push(node.event);
  }

  private processValueNode(node: ValueNodeInterface) {
  }

  private traverseTree(node: NodeInterface) {
    if(!node)
      return ;

    switch(node.kind) {
      case QuerySyntax.AttributeNode:
        this.processAttributeNode(node as AttributeNodeInterface);
        break;
      case QuerySyntax.EventNode:
        return this.processEventNode(node as EventNodeInterface);
      case QuerySyntax.ValueNode:
        return this.processValueNode(node as ValueNodeInterface);
      case QuerySyntax.UnaryExpression:
        return this.traverseTree( (node as UnaryExpressionInterface).left);
      case QuerySyntax.BinaryExpression:
        this.traverseTree( (node as BinaryExpressionInterface).left);
        this.traverseTree( (node as BinaryExpressionInterface).right);
        break;
      case QuerySyntax.TernaryExpression:
        this.traverseTree( (node as TernaryExpressionInterface).left);
        this.traverseTree( (node as TernaryExpressionInterface).middle);
        this.traverseTree( (node as TernaryExpressionInterface).right);
        break;
      case QuerySyntax.LogicalExpression:
        for(let expression of (node as LogicalExpressionInterface).expressions) {
          this.traverseTree(expression);
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

