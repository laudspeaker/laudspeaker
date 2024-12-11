import { 
  Query,
  ExpressionInterface,
  ExpressionInterfaceTypes,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  QuerySyntax,
  LogicalExpressionInterface,
} from "../../";


export class ExpressionHelper {
  static getTypedExpression(
    expression: ExpressionInterface
  ): ExpressionInterfaceTypes {
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
  static isComplete(expression: ExpressionInterfaceTypes) {
    // let exp: ExpressionInterface;
    // const exp = this.getTypedExpression;

    // const typedExpression: ExpressionInterfaceTypes = this.getTypedExpression(expression);

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
}
