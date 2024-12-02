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
  LogicalExpressionInterface,
  NodeFactory,
  QueryConverter,
  QueryPreparer,
  QueryExecuter,
} from "../";

export class Query implements QueryBase {
  expression: LogicalExpressionInterface;
  private nodeFactory = new NodeFactory();
  private preparer = new QueryPreparer();
  private executer = new QueryExecuter();
  private converter;

  constructor() {
    this.expression = this.nodeFactory.createLogicalExpression();
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

  toSQL(): string {
    this.converter = new QueryConverter(QuerySyntax.Query, this);

    return this.converter.toSQL();
  }

  getSelect() {
    return ["*"];
  }

  getFrom() {

  }

  async execute() {
    const preparedQuery = this.preparer.prepareQuery(this);
    const result = this.executer.execute(preparedQuery);
  }
}

