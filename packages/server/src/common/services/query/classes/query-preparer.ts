import {
  NodeInterface,
  Query,
  QuerySyntax,
  QuerySQL,
} from "../";
import { DataSource, Repository } from 'typeorm';

export class QueryPreparer {

  constructor() {
  }

  async execute(query: Query) {
    const preparedQuery = this.prepareQuery(query);

    return this.executeQuery(preparedQuery);
  }

  prepareQuery(query: Query): QuerySQL {
    const sql: QuerySQL = {
      select: [],
      from: [],
      join: [],
      where: [],
      order: [],
    };

    return sql;
  }

  private async executeQuery(sql: QuerySQL) {

  }

  private traverseTree(node: NodeInterface) {
    if(!node)
      return ;

    switch(node.kind) {
      case QuerySyntax.AttributeNode:
        // this.treeCounter.addAttributeNode(node as AttributeNodeInterface);
      //   return this.processAttributeNode(node);
      // case QuerySyntax.EventNode:
      //   return this.processEventNode(node as EventNodeInterface);
      // case QuerySyntax.ValueNode:
      //   return this.processValueNode(node as ValueNodeInterface);
      // case QuerySyntax.UnaryExpression:
      //   return this.processUnaryExpression(node as UnaryExpressionInterface)
      // case QuerySyntax.BinaryExpression:
      //   return this.processBinaryExpression(node as BinaryExpressionInterface)
      // case QuerySyntax.TernaryExpression:
      //   return this.processTernaryExpression(node as TernaryExpressionInterface)
      // case QuerySyntax.LogicalExpression:
      //   return this.processLogicalExpression(node as LogicalExpressionInterface)
      // case QuerySyntax.ExpressionGroup:
      //   return this.processExpressionGroupNode(node as ExpressionGroupInterface);
      // case QuerySyntax.AttributeExpression:
      //   return this.processAttributeExpression(node as ExpressionInterface);
      // case QuerySyntax.EventExpression:
      //   return this.processEventExpression(node as ExpressionInterface);
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return;
    }
  }
}

