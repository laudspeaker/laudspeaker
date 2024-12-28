export enum QuerySyntax {
  StringKeyword                     = 'String',
  NumberKeyword                     = 'Number',
  BooleanKeyword                    = 'Boolean',
  EmailKeyword                      = 'Email',
  DateKeyword                       = 'Date',
  DateTimeKeyword                   = 'DateTime',
  ArrayKeyword                      = 'Array',
  ObjectKeyword                     = 'Object',

  AndKeyword                        = 'AND',
  OrKeyword                         = 'OR',
  NotKeyword                        = 'NOT',
  TrueKeyword                       = 'TRUE',
  FalseKeyword                      = 'FALSE',
  NullKeyword                       = 'NULL',
  UnionKeyword                      = 'UNION',
  IntersectKeyword                  = 'INTERSECT',

  ExistKeyword                      = 'EXISTS',
  DoesNotExistKeyword               = 'NOT EXISTS',
  ContainKeyword                    = 'Contain',
  DoesNotContainKeyword             = 'Not Contain',
   
  IsKeyword                         = 'IS',
  InKeyword                         = 'IN',
  AsKeyword                         = 'AS',

  SelectKeyword                     = 'SELECT',
  FromKeyword                       = 'FROM',
  WhereKeyword                      = 'WHERE',
  LikeKeyword                       = 'LIKE',
  BetweenKeyword                    = 'BETWEEN',
  OrderByKeyword                    = 'ORDER BY',
  GroupByKeyword                    = 'GROUP BY',

  OpenParenToken                    = '(',
  CloseParenToken                   = ')',
  DotToken                          = '.',
  BacktickToken                     = '`',
  CommaToken                        = ',',
  ColonToken                        = ':',

  PlusToken                         = '+',
  MinusToken                        = '-',
  AsteriskToken                     = '*',
  SlashToken                        = '/',
  PercentToken                      = '%',

  AmpersandToken                    = '&',
  AmpersandAmpersandToken           = '&&',
  BarToken                          = '|',
  BarBarToken                       = '||',

  LessThanGreaterThanToken          = '<>',
  EqualsToken                       = '=',
  EqualsEqualsToken                 = '==',
  LessThanToken                     = '<',
  LessThanEqualsToken               = '<=',
  GreaterThanToken                  = '>',
  GreaterThanEqualsToken            = '>=',

  EntityAccessorPeriodToken         = '.',
  EntityAccessorJSONBToken          = '->',
  EntityAccessorTextToken           = '->>',

  HasPerformedKeyword               = 'HasPerformedKeyword',
  HasNotPerformedKeyword            = 'HasNotPerformedKeyword',

  MatchingTypeAll                   = 'MatchingTypeAll',
  MatchingTypeAny                   = 'MatchingTypeAny',

  Node                              = 'Node',
  NodeList                          = 'NodeList',

  UnaryExpression                   = 'UnaryExpression',
  BinaryExpression                  = 'BinaryExpression',
  TernaryExpression                 = 'TernaryExpression',
  LogicalExpression                 = 'LogicalExpression',
  MultiaryExpression                = 'MultiaryExpression',

  AttributeExpression               = 'AttributeExpression',
  EventExpression                   = 'EventExpression',
  EmailExpression                   = 'EmailExpression',
  MessageExpression                 = 'MessageExpression',
  SMSExpression                     = 'SMSExpression',
  PushExpression                    = 'PushExpression',
  SegmentExpression                 = 'SegmentExpression',

  CustomerAttributeNode             = 'CustomerAttributeNode',
  EventNode                         = 'EventNode',
  ValueNode                         = 'ValueNode',

  ResolvedCustomerAttributeNode     = 'ResolvedCustomerAttributeNode',
  ResolvedEventNode                 = 'ResolvedEventNode',

  // used to signal that there is no need
  // to prepare a full SQL query
  FullQuery                         = 'FullQuery',

  // Conversion formats
  Query                             = 'Query',
  Expression                        = 'Expression',
  JSON                              = 'JSON',
  PostgreSQL                        = 'PostgreSQL',
}

export const enum NodeFlags {
  None                      = 0,
  AddPercentToken           = 1 << 0,  // for LIKE and NOT LIKE
  UsePrefixOnly             = 1 << 1,  // for exists operator on jsonb
  HasMultipleEventNames     = 1 << 2,  // For PG adapter to pick the right CTE
  SelectFromCTE             = 1 << 3,  // ?
  CountQuery                = 1 << 4,  // For queries when we need the row count
}

export const enum QueryFlags {
  None                      = 0,

  // common
  InsertQuery               = 1 << 1,
  FindQuery                 = 1 << 2,

  // query methods
  FindOne                   = 1 << 10,
  FindAll                   = 1 << 11,
  Count                     = 1 << 13,

  // event CTE is required
  EventCTE                  = 1 << 20,

  // INSERT
  InsertJourneyLocations    = 1 << 30,
}

export type OperatorKind =
  | QuerySyntax.AndKeyword
  | QuerySyntax.OrKeyword
  | QuerySyntax.NotKeyword
  | QuerySyntax.ExistKeyword
  | QuerySyntax.DoesNotExistKeyword
  | QuerySyntax.ContainKeyword
  | QuerySyntax.DoesNotContainKeyword
  | QuerySyntax.IsKeyword
  | QuerySyntax.InKeyword
  | QuerySyntax.LikeKeyword
  | QuerySyntax.BetweenKeyword
  | QuerySyntax.PlusToken
  | QuerySyntax.MinusToken
  | QuerySyntax.AsteriskToken
  | QuerySyntax.SlashToken
  | QuerySyntax.PercentToken
  | QuerySyntax.AmpersandToken
  | QuerySyntax.AmpersandAmpersandToken
  | QuerySyntax.BarToken
  | QuerySyntax.BarBarToken
  | QuerySyntax.LessThanGreaterThanToken
  | QuerySyntax.EqualsToken
  | QuerySyntax.EqualsEqualsToken
  | QuerySyntax.LessThanToken
  | QuerySyntax.LessThanEqualsToken
  | QuerySyntax.GreaterThanToken
  | QuerySyntax.GreaterThanEqualsToken
  | QuerySyntax.HasPerformedKeyword
  | QuerySyntax.HasNotPerformedKeyword;

export type EventOperatorKind = 
  | QuerySyntax.HasPerformedKeyword
  | QuerySyntax.HasNotPerformedKeyword;

export type UnaryOperatorKind = 
  | QuerySyntax.ExistKeyword
  | QuerySyntax.DoesNotExistKeyword;

export type ExpressionKind = 
  | QuerySyntax.UnaryExpression
  | QuerySyntax.BinaryExpression
  | QuerySyntax.TernaryExpression
  | QuerySyntax.LogicalExpression
  | QuerySyntax.EmailExpression
  | QuerySyntax.MessageExpression
  | QuerySyntax.SMSExpression
  | QuerySyntax.PushExpression
  | QuerySyntax.SegmentExpression;

export type LogicalExpressionOperatorKind = 
  | QuerySyntax.AndKeyword
  | QuerySyntax.OrKeyword;

export type QueryAttributeType =
  | QuerySyntax.StringKeyword
  | QuerySyntax.NumberKeyword
  | QuerySyntax.BooleanKeyword
  | QuerySyntax.EmailKeyword
  | QuerySyntax.DateKeyword
  | QuerySyntax.DateTimeKeyword
  | QuerySyntax.ArrayKeyword
  | QuerySyntax.ObjectKeyword;

export type ResolvedKind = 
 | QuerySyntax.ResolvedCustomerAttributeNode
 | QuerySyntax.ResolvedEventNode;

export interface NodeInterface {
  readonly kind: QuerySyntax;
  readonly parent?: NodeInterface;
  readonly flags: NodeFlags;

  // resolvedNode?: ResolvableNodeType;
  resolvedNode?: NodeInterface;
  aggregatedData?: AggregatedNodeData;
}

export interface NodeFactoryInterface {
  createBaseNode<T extends NodeInterface>(kind: T["kind"], parent?: NodeInterface): T;
  createBaseResolvedNode<T extends ResolvedNodeInterface>(kind: T["kind"], parent: ResolvableNodeType): T;
  createUnaryExpression(): UnaryExpressionInterface;
  createBinaryExpression(): BinaryExpressionInterface;
  createTernaryExpression(): TernaryExpressionInterface;
  createLogicalExpression(): LogicalExpressionInterface;
  addExpressionToLogicalExpression(
    logicalExpression: LogicalExpressionInterface,
    expression: ExpressionInterfaceType
  );
  updateExpressionOperator(
    expression: ExpressionInterfaceType,
    operator: OperatorKind
  );
  createCustomerAttributeExpressionNode(
    attribute: string,
    operator: OperatorKind,
    type: QueryAttributeType,
    value: any,
    parent?: NodeInterface
  );
  createEventExpressionNode(
    event: string,
    operator: OperatorKind,
    count: number,
    attributes?: ExpressionInterface[],
    parent?: NodeInterface
  );
  createCustomerAttributeNode(attribute: string, type: QueryAttributeType);
  createEventNode(event: string);
  createValueNode(value: any, type?: QueryAttributeType);

  createResolvedCustomerAttributeNode(
    attribute: AttributeInterface,
    operator: OperatorKind,
    value: any,
    parent: ResolvableNodeType
  ): ResolvedCustomerAttributeNodeInterface;
  createResolvedEventNode(
    event: string,
    operator: OperatorKind,
    count: number,
    parent: ResolvableNodeType,
    attributes?: any
  ): ResolvedEventNodeInterface;
  updateNodeAggregatedData(node: NodeInterface, other: NodeInterface);
}



export interface ExpressionInterface extends NodeInterface {
  kind: ExpressionKind;
  operator: OperatorKind;
}

export interface UnaryExpressionInterface extends ExpressionInterface {
  kind: QuerySyntax.UnaryExpression;
  operator: UnaryOperatorKind;
  left: NodeInterface;
} 

export interface BinaryExpressionInterface extends ExpressionInterface {
  kind: QuerySyntax.BinaryExpression;
  left: NodeInterface;
  right: NodeInterface;
}

export interface TernaryExpressionInterface extends ExpressionInterface {
  kind: QuerySyntax.TernaryExpression;
  left: NodeInterface;
  middle: NodeInterface;
  right: NodeInterface;
}

export interface LogicalExpressionInterface extends ExpressionInterface {
  kind: QuerySyntax.LogicalExpression;
  operator: LogicalExpressionOperatorKind;
  expressions: ExpressionInterfaceType[];
}

// Nodes for variables
export interface CustomerAttributeNodeInterface extends NodeInterface {
  kind: QuerySyntax.CustomerAttributeNode;
  attribute: string;
  prefix?: string;
  type: QueryAttributeType;
}

export interface EventNodeInterface extends NodeInterface {
  kind: QuerySyntax.EventNode;
  event: string;
  count: number;
  prefix?: string;
}

export interface ValueNodeInterface extends NodeInterface {
  kind: QuerySyntax.ValueNode;
  value: any;
  type: QueryAttributeType;
}

export type ExpressionInterfaceType = 
  | UnaryExpressionInterface
  | BinaryExpressionInterface
  | TernaryExpressionInterface
  | LogicalExpressionInterface;

export type ExpressionInterfaces = 
  | UnaryExpressionInterface
  | BinaryExpressionInterface
  | TernaryExpressionInterface
  | LogicalExpressionInterface;

// export type ExpressionWithLHSInterfaces = 
//   | QuerySyntax.UnaryExpression
//   | QuerySyntax.BinaryExpression
//   | QuerySyntax.TernaryExpression;

export type ExpressionWithLHSInterfaces = 
  | UnaryExpressionInterface
  | BinaryExpressionInterface
  | TernaryExpressionInterface;


export type QueryConversionAllowedInputType = 
  | Record<string, string>;

export type SimpleNodeType = 
  | CustomerAttributeNodeInterface
  | EventNodeInterface
  | ValueNodeInterface;

export type ProcessableNodeType = 
  | ExpressionKind
  | ExpressionInterface
  | SimpleNodeType;


export type QueryElement = ProcessableNodeType;

export interface QueryInterface {
  nodeFactory: NodeFactoryInterface;
  expression: LogicalExpressionInterface;
  context: QueryContext;
  
  // Conversions
  to(format: QueryFormat);
  toSQL(): string;

  // Add
  add(expression: ExpressionInterfaceType)
  addBulk(expressions: ExpressionInterfaceType[])

  // overrides select, from
  // set(setting: QuerySyntax)
  setMatchingToAll();
  setMatchingToAny();
  setContext(context: QueryContext);

  // Validators
  isValid(): boolean;

  // getters
  getRootExpression(): LogicalExpressionInterface;
  getTopLevelExpressions(): LogicalExpressionInterface["expressions"];
  getOperator(): LogicalExpressionInterface["operator"];
}

export interface QueryExecuterInterface {
  execute(query: QueryInterface, dataSource);
}

export interface QueryConverterInterface {
  from(input: any, inputFormat: QueryFormat): QueryConverterInterface;
  to(format: QueryFormat);
  canConvert(): boolean;
}

export interface QueryPreparerInterface {
  query: any;
  queryData: QueryData;
  finalQuery: QuerySQL;
  fullSQL: string;

  // flags: QueryPreparerFlags;

  // statements: SQLStatements[] = [];
}

export interface QueryResolverInterface {
  nodeFactory: NodeFactoryInterface;
  resolve(query: QueryInterface);
}



export interface QueryContext extends Record<string, any> {}



// export interface QueryData {
//   customerAttributes: string[];
//   eventSearchCriteria: {
//     event: string,
//     count: number;
//   }[];
//   allEventNames: Set<string>;
//   cte: Record<string, any>[];
//   tables: string[];

//   flags: QueryFlags;
// }

export interface QuerySQL {
  select: string[];
  from: string[];
  join: string[];
  where: string[];
  order: string[];
}

export interface QueryResult {

}

export type QueryFormat =
  | QuerySyntax.Query
  | QuerySyntax.Expression
  | QuerySyntax.JSON
  | QuerySyntax.PostgreSQL;

export type QueryAdapterSupportedType = any;

// export type QueryAdapterSupportedType =
//   | QueryInterface
//   | ExpressionInterfaceType
//   | Record<string, any>
//   | string;

// export const enum QueryPreparerFlags {
//   None                      = 0,
//   IsCountQuery              = 1 << 0,  // COUNT(*)
// }

export const enum QueryResolverFlags {
  None                      = 0,
  IsCountQuery              = 1 << 0,  // COUNT(*)
}

export interface FullQueryInterface extends NodeInterface {
  kind: QuerySyntax.FullQuery;
  query: QueryInterface;
}



export interface QueryResolverResult {
  customers: {},
  events: {},
}

export enum CustomerAttributeClassification {
  USER,
  SYSTEM,
}

// export enum CustomerAttributeClassificationMap {
//   [CustomerAttributeClassification.USER] = 'user_attributes',
//   [CustomerAttributeClassification.SYSTEM] = 'system_attributes',
// }

export type ResolvableNodeType = ExpressionInterfaceType;
  // | CustomerAttributeNodeInterface
  // | EventNodeInterface;

export interface AttributeInterface {
  name: string,
  type: QueryAttributeType,
  classification: CustomerAttributeClassification;
}

export interface ResolvedNodeInterface extends NodeInterface
{
  kind: ResolvedKind;
  // parent: ResolvableNodeType;
  parent: NodeInterface;
  operator: OperatorKind;
  // dateFilter: DateFilterInterface;
}

export interface ResolvedCustomerAttributeNodeInterface extends ResolvedNodeInterface {
  kind: QuerySyntax.ResolvedCustomerAttributeNode;

  attribute: AttributeInterface;
  value: any;
}

export interface ResolvedEventNodeInterface extends ResolvedNodeInterface {
  kind: QuerySyntax.ResolvedEventNode;

  event: string,
  count: number; // -1 for NotPerformed
  attributes?: AttributeInterface[];
}

export type QueryResolverObjectTypes = 
  | ResolvedCustomerAttributeNodeInterface
  | ResolvedEventNodeInterface;

export interface AggregatedNodeData {
  distinctEvents: Set<string>;
  distinctAttributes: Set<string>;

  eventFilters: Record<string, any>[];
  customerAttributeFilters: Record<string, any>[];
}

// export interface AggregatedResolvedData {
//   // attributes: AttributeFilter[],
//   // events: EventFilter[],
//   eventFilter: {
//     distinctEvents: Set<string>;
//     eventNodes: ResolvedEventNodeInterface[];
//   }
//   // filters: QueryFilterInterface[]
// }

export interface QueryData {
  query: QueryInterface;
  context: QueryContext;

  customerAttributes: string[];
  eventSearchCriteria: {
    event: string,
    count: number;
    // dateBegin:
    // dateEnd:
  }[];
  distinctEvents: Set<string>;
  flags: QueryFlags;

  // SQL-related
  selectValues: string[],
  tables: string[],
  condition: string;


}