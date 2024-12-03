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

  MinusGreaterThanGreaterThanToken  = '->>',
  MinusMinusGreaterThanToken        = '-->',

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

  AttributeNode                     = 'AttributeNode',
  EventNode                         = 'EventNode',
  ValueNode                         = 'ValueNode',

  // Conversion formats
  Query                             = 'Query',
  Expression                        = 'Expression',
  Postgres                          = 'Postgres',
  JSON                              = 'JSON',
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
  | QuerySyntax.MultiaryExpression;
  // | QuerySyntax.AttributeExpression
  // | QuerySyntax.EventExpression
  // | QuerySyntax.EmailExpression
  // | QuerySyntax.MessageExpression
  // | QuerySyntax.SMSExpression
  // | QuerySyntax.PushExpression
  // | QuerySyntax.SegmentExpression;

export type LogicalExpressionKind = 
  | QuerySyntax.AndKeyword
  | QuerySyntax.OrKeyword;

export type NodeListOperatorKind = 
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

export const enum NodeFlags {
  None                      = 0,
  AddPercentToken           = 1 << 0,  // for LIKE and NOT LIKE
  UsePrefixOnly             = 1 << 1,  // for exists operator on jsonb
}

export interface NodeInterface {
  readonly kind: QuerySyntax;
  readonly parent?: NodeInterface;
  readonly flags: NodeFlags;
}

export interface ExpressionInterface extends NodeInterface {
  kind: ExpressionKind;
  operator: OperatorKind;
}

// export interface NodeListInterface extends NodeInterface {
//   kind: QuerySyntax.NodeList;
//   nodes: NodeInterface[];
//   operator: NodeListOperatorKind;

//   add(node: NodeInterface);
//   setMatchingToAll();
//   setMatchingToAny();
//   getLength(): number;
// }

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
  operator: LogicalExpressionKind;
  expressions: ExpressionInterface[];

  add(node: ExpressionInterface);
  getLength(): number;
  setMatchingToAll();
  setMatchingToAny();
}

// export interface MultiaryExpressionInterface {
//   kind: QuerySyntax.MultiaryExpression;
//   expressions: ExpressionInterface[];
// }

// export interface EventExpressionInterface extends ExpressionInterface {
//   kind: QuerySyntax.EventExpression;
//   operator: EventOperatorKind;
//   event: string;
//   attributeExpressions?: ExpressionInterface[]
// }

// Nodes for variables
export interface AttributeNodeInterface extends NodeInterface {
  kind: QuerySyntax.AttributeNode;
  attribute: string;
  prefix?: string;
  type: QueryAttributeType;
}

export interface EventNodeInterface extends NodeInterface {
  kind: QuerySyntax.EventNode;
  event: string;
  prefix?: string;
}

export interface ValueNodeInterface extends NodeInterface {
  kind: QuerySyntax.ValueNode;
  value: any;
  type: QueryAttributeType;
}

export interface QueryBase {
  expression: LogicalExpressionInterface;
  toSQL(): string;
}

export type QueryConversionAllowedInputType = 
  | Record<string, string>;

export type SimpleNodeType = 
  | AttributeNodeInterface
  | EventNodeInterface
  | ValueNodeInterface;

export type ProcessableNodeType = 
  | ExpressionKind
  | ExpressionInterface
  | SimpleNodeType;

export type QueryElement = ProcessableNodeType;

export interface QueryIntermediate {
  customerAttributes: string[];
  eventNames: string[];
  eventAttributes: string[];
  tables: string[];
}

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
  | QuerySyntax.Postgres
  | QuerySyntax.JSON;

export const enum QueryPreparerFlags {
  None                      = 0,
  IsCountQuery              = 1 << 0,  // COUNT(*)
}
