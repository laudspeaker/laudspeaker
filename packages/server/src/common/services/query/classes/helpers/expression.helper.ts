import { 
  Query,
  ExpressionInterface,
  ExpressionInterfaceType,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  QuerySyntax,
  LogicalExpressionInterface,
  NodeInterface,
  ExpressionWithLHSInterfaces,
} from "../../";


export class ExpressionHelper {
  static getTypedExpression(
    expression: ExpressionInterface
  ): ExpressionInterfaceType {
    switch (expression.kind) {
      case QuerySyntax.UnaryExpression:
        return expression as UnaryExpressionInterface;
      case QuerySyntax.BinaryExpression:
        return expression as BinaryExpressionInterface;
      case QuerySyntax.TernaryExpression:
        return expression as TernaryExpressionInterface;
      case QuerySyntax.LogicalExpression:
        return expression as LogicalExpressionInterface;
      default:
        // expression satisfies never;
        break;
    }
  }

  // TODO: traverse the full tree
  static isComplete(expression: ExpressionInterfaceType) {
    // let exp: ExpressionInterface;
    // const exp = this.getTypedExpression;

    // const typedExpression: ExpressionInterfaceType = this.getTypedExpression(expression);

    switch (expression.kind) {
      case QuerySyntax.UnaryExpression:
        return expression.left && expression.operator;
      case QuerySyntax.BinaryExpression:
        return expression.left && expression.operator && expression.right;
      case QuerySyntax.TernaryExpression:
      return expression.left && expression.operator && expression.middle && expression.right;
      case QuerySyntax.LogicalExpression:
        for (let nestedExpression of expression.expressions) {
          if (!this.isComplete(this.getTypedExpression(nestedExpression)))
            return false;
        }

        return true;
      // case QuerySyntax.EmailExpression:
      // case QuerySyntax.MessageExpression:
      // case QuerySyntax.SMSExpression:
      // case QuerySyntax.PushExpression:
      //   return true;
      default:
        return false;
      //   // TODO: assertUnreachable()
      //   expression satisfies never;
    }

    return false;
  }

  static isCustomerAttributeNode(node: NodeInterface) {
    return node?.kind == QuerySyntax.CustomerAttributeNode;
  }

  static isEventNode(node: NodeInterface) {
    return node?.kind == QuerySyntax.EventNode;
  }

  static isValueNode(node: NodeInterface) {
    return node?.kind == QuerySyntax.ValueNode;
  }

  static isCustomerAttributeExpression(node: ExpressionWithLHSInterfaces) {
    return this.isCustomerAttributeNode(node.left);
  }

  static isEventExpression(node: ExpressionWithLHSInterfaces) {
    return this.isEventNode(node.left);
  }
}
