import { QueryAdapterBase } from "../";
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

export class JSONAdapter extends QueryAdapterBase {
  toQuery(input: Record <string, any>): Query {
    return this.generateQuery(input);
  }

  toSQL(input: Record <string, any>): string {
    const query: Query = this.toQuery(input);

    return query.toSQL();
  }

  private generateQuery(input: Record <string, any>): Query {
    const query: Query = this.getQueryFromInput(input);

    return query;
  }

  private processStatement(statement: any) {
    switch(statement?.type) {
      case "all":
      case "any":
        return this.toLogicalExpression(statement);
      case "Attribute":
      case "Event":
        return this.toBinaryExpression(statement);
      default:
        return "";
    }
  }

  private toLogicalExpression(statement: any) {
    const node = this.nodeFactory.createLogicalExpression();

    switch(statement.type) {
      case "all":
        this.nodeFactory.updateExpressionOperator(node, QuerySyntax.AndKeyword);
        break;
      case "any":
        this.nodeFactory.updateExpressionOperator(node, QuerySyntax.OrKeyword);
        break;
    }

    for(let subStatement of statement.statements) {
      let exp = this.processStatement(subStatement);

      this.nodeFactory.addExpressionToLogicalExpression(node, exp);
    }

    return node;
  }

  private toBinaryExpression(statement: any) {
    const operator = this.getOperatorKindFromString(statement.comparisonType);
    let attributeType;

    switch(statement.type) {
      case "Attribute":
        attributeType = this.getAttributeTypeFromString(statement.valueType);
        return this.nodeFactory.createCustomerAttributeExpressionNode(
          statement.key,
          operator,
          attributeType,
          statement.value,
        );
      case "Event":
        return this.nodeFactory.createEventExpressionNode(
          statement.eventName,
          operator,
          statement.value,
          statement.payload,
        );
    }
  }

  private getOperatorKindFromString(operatorStr): OperatorKind {
    switch(operatorStr) {
      // Attribute
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
      // Events
      case 'has performed':
        return QuerySyntax.HasPerformedKeyword;
      case 'has not performed':
        return QuerySyntax.HasNotPerformedKeyword;
      default:
        throw new Error("OperatorKind error");
    }
  }

  private getAttributeTypeFromString(typeStr: string): QueryAttributeType {
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

  private queryFromLogicalExpression(node: LogicalExpressionInterface) {
    const query = new Query();

    if (node.operator == QuerySyntax.AndKeyword)
      query.setMatchingToAll();
    else
      query.setMatchingToAny();

    query.addBulk(node.expressions);

    return query;
  }

  private queryFromExpression(node: ExpressionInterface) {
    switch(node.kind) {
      case QuerySyntax.LogicalExpression:
        return this.queryFromLogicalExpression(node as LogicalExpressionInterface);
    }
  }

  private getQueryFromInput(input: Record <string, any>): Query {
    const inputJSON = input?.inclusionCriteria?.query ?? input?.query;

    if (!inputJSON)
      return new Query();
    
    const logicalExpression: LogicalExpressionInterface = this.processStatement(inputJSON);

    const query: Query = this.queryFromExpression(logicalExpression);

    return query;
  }
}
