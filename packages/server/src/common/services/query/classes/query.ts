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
}

