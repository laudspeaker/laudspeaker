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

export class JSONFormatter extends QueryFormatterBase {

  toQuery() {
    const logicalExpression = this.processStatement(this.input.inclusionCriteria.query);

    const query = this.queryFromExpression(logicalExpression);

    return query;
  }

  processStatement(statement: any) {
    switch(statement.type) {
      case "all":
      case "any":
        return this.toLogicalExpression(statement);
      case "Attribute":
      case "Event":
        return this.toBinaryExpression(statement);
    }
  }

  toLogicalExpression(statement: any) {
    const node = this.nodeFactory.createLogicalExpression();

    switch(statement.type) {
      case "all":
        this.nodeFactory.updateLogicalExpressionOperatorToAnd(node);
        break;
      case "any":
        this.nodeFactory.updateLogicalExpressionOperatorToOr(node);
        break;
    }

    for(let subStatement of statement.statements) {
      let exp = this.processStatement(subStatement);

      this.nodeFactory.addExpressionToLogicalExpression(node, exp);
    }

    return node;
  }

  toBinaryExpression(statement: any) {
    const operator = this.getOperatorKindFromString(statement.comparisonType);
    const attributeType = this.getAttributeTypeFromString(statement.valueType);

    switch(statement.type) {
      case "Attribute":
        return this.nodeFactory.createAttributeExpressionNode(
          statement.key,
          operator,
          attributeType,
          statement.value
        );
      case "Event":
        return this.nodeFactory.createEventExpressionNode(
          statement.key,
          operator,
          statement.value
        );
    }
  }

  getOperatorKindFromString(operatorStr): OperatorKind {
    switch(operatorStr) {
      case "is equal to":
        return QuerySyntax.EqualsToken;
      case 'is not equal to':
        return QuerySyntax.LessThanGreaterThanToken;
      case 'during':
        return QuerySyntax.BetweenKeyword;
      // case 'length is greater than':
      //   return QuerySyntax.EqualsToken;
      // case 'length is less than':
      //   return QuerySyntax.EqualsToken;
      // case 'length is equal to':
      //   return QuerySyntax.EqualsToken;
      case 'exist':
        return QuerySyntax.ExistKeyword;
      case 'not exist':
        return QuerySyntax.DoesNotExistKeyword;
      case 'is greater than':
        return QuerySyntax.GreaterThanToken;
      case 'is less than':
        return QuerySyntax.LessThanToken;
      case 'contains':
        return QuerySyntax.ContainKeyword;
      case 'does not contain':
        return QuerySyntax.DoesNotContainKeyword;
      case 'after':
        return QuerySyntax.GreaterThanToken;
      case 'before':
        return QuerySyntax.LessThanToken;
      default:
        throw new Error("OperatorKind error");
    }
  }

  getAttributeTypeFromString(typeStr: string): QueryAttributeType {
    switch(typeStr) {
      case 'String':
        return QuerySyntax.StringKeyword;
      case 'Number':
        return QuerySyntax.NumberKeyword;
      case 'Boolean':
        return QuerySyntax.BooleanKeyword;
      case 'Email':
        return QuerySyntax.EmailKeyword;
      case 'Date':
        return QuerySyntax.DateKeyword;
      case 'DateTime':
        return QuerySyntax.DateTimeKeyword;
      case 'Array':
        return QuerySyntax.ArrayKeyword;
      case 'Object':
        return QuerySyntax.ObjectKeyword;
      default:
        return QuerySyntax.StringKeyword;
    }
  }

  queryFromLogicalExpression(node: LogicalExpressionInterface) {
    const query = new Query();

    if (node.operator == QuerySyntax.AndKeyword)
      query.setMatchingToAll();
    else
      query.setMatchingToAny();

    for(let expression of node.expressions)
      query.add(expression);

    return query;
  }

  queryFromExpression(node: ExpressionInterface) {
    switch(node.kind) {
      case QuerySyntax.LogicalExpression:
        return this.queryFromLogicalExpression(node as LogicalExpressionInterface);
    }
  }

  processBinaryExpression(node: BinaryExpressionInterface) {

  }

  processLogicalExpression(node: LogicalExpressionInterface) {

  }

  // processAttributeExpression(node: QueryElement) {

  // }

  // processEventExpression(node: QueryElement) {

  // }

  processAttributeNode(node: QueryElement) {

  }

  processEventNode(node: QueryElement) {

  }

  processValueNode(node: QueryElement) {

  }

  processExpressionGroupNode(node: QueryElement) {

  }

  
  
}
