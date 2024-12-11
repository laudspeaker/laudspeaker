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
  QueryContext,
  QueryConverter,
  QueryElement,
  QueryExecuter,
  QueryHelper,
  QueryInterface,
  QueryPreparer,
  QuerySyntax,
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
} from "../";

export class Query implements QueryInterface {
  expression: LogicalExpressionInterface;

  // context data include workspace_id any other values we might need
  context: QueryContext;
  private nodeFactory = new NodeFactory();
  private preparer = new QueryPreparer();
  private executer = new QueryExecuter();
  private converter = new QueryConverter();

  selectParams: string[] = ['*'];

  constructor(context: QueryContext) {
    this.expression = this.nodeFactory.createLogicalExpression();

    this.context = context;
  }

  static fromJSON(jsonQuery: Record<string, any>, context: QueryContext) {
    return new QueryConverter()
            .from(QuerySyntax.JSON, jsonQuery, context)
            .toQuery();
  }

  setMatchingToAll() {
    this.nodeFactory.updateLogicalExpressionOperatorToAnd(this.expression);
  }

  setMatchingToAny() {
    this.nodeFactory.updateLogicalExpressionOperatorToOr(this.expression);
  }

  add(expression: ExpressionInterface) {
    this.nodeFactory.addExpressionToLogicalExpression(this.expression, expression);

    this.triggerUpdate();
  }

  addBulk(expressions: ExpressionInterface[]) {
    for(let expression of expressions)
      this.nodeFactory.addExpressionToLogicalExpression(this.expression, expression);

    this.triggerUpdate();
  }

  getExpressions(): ExpressionInterface[] {
    return this.expression.expressions;
  }

  getOperator() {
    return this.expression.operator;
  }

  // checks if query can be executed and not missing anything
  isComplete(): boolean {
    return QueryHelper.isComplete(this);
  }

  toSQL(): string {
    if (!this.isComplete())
      return "";

    this.converter.setInput(this);
    this.converter.setContext(this.context);

    return this.converter.toSQL();
  }

  toString(): string {
    return this.toSQL();
  }

  fullSQL(): string {
    return this.preparer.fullSQL;
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
    this.preparer.setIsCountQuery();

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

  private triggerUpdate() {
    this.preparer.prepareQuery(this);
  }
}

