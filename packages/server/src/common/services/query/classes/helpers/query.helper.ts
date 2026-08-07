import { 
  ExpressionHelper,
  Query,
} from "../../";

export class QueryHelper {
  static isComplete(query: Query) {
    const expressions = query.getTopLevelExpressions();

    if (expressions.length == 0)
      return false;

    for (let expression of expressions) {
      if (!ExpressionHelper.isComplete(
        ExpressionHelper.getTypedExpression(expression)
      ))
        return false;
    }

    return true;
  }
}
