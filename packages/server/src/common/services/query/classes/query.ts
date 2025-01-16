import { 
  QueryInterface,
  NodeFactory,
  LogicalExpressionInterface,
  QueryContext,
  QuerySyntax,
  QueryConverter,
  QueryFormat,
  QueryValidator,
  QueryAdapterSupportedType,
  LogicalExpressionOperatorKind,
  ExpressionInterfaceType,
  QueryFlags,
  QueryExecuter,
  QueryOrderDirection,
} from "../";

export class Query implements QueryInterface {
  nodeFactory = new NodeFactory();
  expression: LogicalExpressionInterface;

  // context data includes workspace_id and any other values 
  // that the query needs to execute or return the final SQL
  context: QueryContext;

  // flags modify the behaviour of the queue
  flags = QueryFlags.None;

  _select = [];
  _from = [];
  _ctes = [];
  _order = null;
  _orderDirection = QueryOrderDirection.ASC;
  _limit = null;
  _offset = null;

  constructor(context?: QueryContext) {
    this.expression = this.nodeFactory.createLogicalExpression();

    this.context = context ?? {}
  }

  static fromJSON(jsonQuery: Record<string, any>): Query  {
    return QueryConverter
      .from(jsonQuery, QuerySyntax.JSON)
      .to(QuerySyntax.Query) as Query;
  }

  // conversions
  to(format: QueryFormat): QueryAdapterSupportedType {
    const converter = new QueryConverter();

    return converter.from(this, QuerySyntax.Query).to(format);
  }

  toSQL(): string {
    return this.to(QuerySyntax.PostgreSQL) as string;
  }

  // set(setting: QuerySyntax) {}
  setMatchingToAll() {
    this.setOperator(QuerySyntax.AndKeyword);
  }

  setMatchingToAny() {
    this.setOperator(QuerySyntax.OrKeyword);
  }

  setContext(context: QueryContext) {
    this.context = {
      ...this.context,
      ...context
    };
  }

  add(expression: ExpressionInterfaceType) {
    this.nodeFactory.addExpressionToLogicalExpression(this.expression, expression);
  }

  addBulk(expressions: ExpressionInterfaceType[]) {
    expressions.forEach((expression) => this.add(expression));
  }


  getRootExpression(): LogicalExpressionInterface {
    return this.expression;
  }

  getTopLevelExpressions(): ExpressionInterfaceType[] {
    return this.getRootExpression().expressions;
  }

  getOperator() {
    return this.getRootExpression().operator;
  }

  getContextValue(str: string) {
    return this.context[str];
  }

  isValid(): boolean {
    return QueryValidator.validate(this);
  }

  // Query Execution
  async findOne(dataSource) {
    this.setFindFlags([
      QueryFlags.FindOne,
    ]);

    return await this.execute(dataSource);
  }

  async findAll(dataSource) {
    this.setFindFlags([
      QueryFlags.FindAll,
    ]);

    return await this.execute(dataSource);
  }

  // return an array of ids
  async ids(dataSource) {
    this.setFindFlags([
      QueryFlags.GetIDs,
    ]);

    return await this.execute(dataSource);
  }

  async count(dataSource) {
    this.setFindFlags([QueryFlags.Count]);

    return await this.execute(dataSource);
  }

  // methods to insert the query into a specific table
  async createJourneyLocationsFromQuery(dataSource) {
    this.setInsertFlags([
      QueryFlags.InsertJourneyLocations,
    ]);

    await this.execute(dataSource);
  }

  async execute(dataSource) {
    const executer = new QueryExecuter();

    return executer.execute(this, dataSource);
  }

  limit(limit: number): QueryInterface {
    this._limit = limit;

    return this;
  }

  offset(offset: number): QueryInterface {
    this._offset = offset;

    return this;
  }

  order(order: string, direction: string): QueryInterface {
    this._order = order;
    this._orderDirection = direction == 'DESC' ? QueryOrderDirection.DESC : QueryOrderDirection.ASC;

    return this;
  }

  private setOperator(operator: LogicalExpressionOperatorKind) {
    this.nodeFactory.updateExpressionOperator(this.expression, operator);
  }

  private setInsertFlags(flags: QueryFlags[]) {
    // common insert flags
    const insertFlags: QueryFlags[] = [
      QueryFlags.InsertQuery
    ];

    this.setFlags([
      ...insertFlags,
      ...flags,
    ]);
  }

  private setFindFlags(flags: QueryFlags[]) {
    this.resetFindFlags();

    // common find & query flags
    const findFlags: QueryFlags[] = [
      QueryFlags.FindQuery,
    ];

    this.setFlags([
      ...findFlags,
      ...flags,
    ]);
  }

  private resetFindFlags() {
    this.resetFlags([
      QueryFlags.FindQuery,
      QueryFlags.FindOne,
      QueryFlags.FindAll,
      QueryFlags.Count,
    ]);
  }

  private setFlags(flags: QueryFlags[]) {
    for (const flag of flags)
      this.flags |= flag;
  }

  private resetFlags(flags: QueryFlags[]) {
    for (const flag of flags)
      this.flags &= ~flag;
  }
}

