import { 
  AttributeNodeInterface,
  BinaryExpressionInterface,
  EventNodeInterface,
  ExpressionInterface,
  ExpressionInterfaceTypes,
  LogicalExpressionInterface,
  Node,
  NodeFactory,
  NodeInterface,
  QueryBase,
  QueryConverter,
  QueryElement,
  QueryExecuter,
  QuerySyntax,
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
} from "../";

export class Query implements QueryBase {
  expression: LogicalExpressionInterface;
  private nodeFactory = new NodeFactory();
  private executer = new QueryExecuter();
  private converter;

  selectParams: string[] = ['*'];

  constructor() {
    this.expression = this.nodeFactory.createLogicalExpression();
  }

  static fromJSON(jsonQuery: Record<string, any>) {
    const converter = new QueryConverter(QuerySyntax.JSON, jsonQuery);

    return converter.toQuery();
  }

  setMatchingToAll() {
    this.nodeFactory.updateLogicalExpressionOperatorToAnd(this.expression);
  }

  setMatchingToAny() {
    this.nodeFactory.updateLogicalExpressionOperatorToOr(this.expression);
  }

  add(element: ExpressionInterface) {
    this.nodeFactory.addExpressionToLogicalExpression(this.expression, element);
  }

  getExpressions(): ExpressionInterface[] {
    return this.expression.expressions;
  }

  getOperator() {
    return this.expression.operator;
  }

  // checks if query can be executed and not missing anything
  isComplete() {
    const expressions = this.getExpressions();

    if (expressions.length == 0)
      return false;

    for (let expression of expressions) {
      if (!this.isCompleteExpression(this.getTypedExpression(expression)) )
        return false;
    }

    return true;
  }

  private getTypedExpression(expression: ExpressionInterface): ExpressionInterfaceTypes {
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
        break;
        // expression satisfies never;
    }
  }

  // TODO: traverse the full tree
  private isCompleteExpression(expression: ExpressionInterfaceTypes) {
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
          if (!this.isCompleteExpression(this.getTypedExpression(nestedExpression)))
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

  toSQL(): string {

    if (!this.isComplete())
      return "";

    this.converter = new QueryConverter(QuerySyntax.Query, this);

    return this.converter.toSQL();
  }

  toString(): string {
    return this.toSQL();
  }

  // query.count(*)
  // query.count(DISTINCT(id))  
  async count(...fields: string[]) {
  }

  async getOne(dataSource) {
    // return this.executer.getOne(this, dataSource);
  }

  async getAll(dataSource) {
    // return this.executer.getAll(this, dataSource);
  }

  async getCount(dataSource) {
    return this.executer.getCount(this, dataSource);
  }

  async execute(dataSource) {
    return this.executer.execute(this, dataSource);
  }

  select(params: string[]) {
    this.selectParams = params;
  }

  getWhereStatement() {
    this.toSQL();
  }


}

