import { 
  QueryElement,
  QueryBase,
  QuerySyntax,
  NodeInterface,
  ExpressionInterface,
  AttributeNodeInterface,
  EventNodeInterface,
  ValueNodeInterface,
  Node,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  LogicalExpressionInterface,
  NodeFactory,
  QueryConverter,
  QueryExecuter,
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
      if (!this.isCompleteExpression(expression) )
        return false;
    }

    return true;
  }

  // TODO: traverse the full tree
  private isCompleteExpression(expression: ExpressionInterface) {
    let exp;

    switch (expression.kind) {
      case QuerySyntax.UnaryExpression:
        exp = expression as UnaryExpressionInterface;
        return exp.lhs && exp.operator;
      case QuerySyntax.BinaryExpression:
        exp = expression as BinaryExpressionInterface;
        return exp.lhs && exp.operator && exp.rhs;
      case QuerySyntax.TernaryExpression:
        exp = expression as TernaryExpressionInterface;
      return exp.lhs && exp.operator && exp.middle && exp.rhs;
      case QuerySyntax.LogicalExpression:
        exp = expression as LogicalExpressionInterface;
        for (let nestedExpression of exp.expressions) {
          if (!this.isCompleteExpression(nestedExpression))
            return false;
        }

        return true;
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return true;
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

