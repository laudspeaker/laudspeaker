import { 
  AttributeNodeInterface,
  BinaryExpressionInterface,
  EventNodeInterface,
  EventOperatorKind,
  ExpressionInterface,
  LogicalExpressionInterface,
  Node,
  NodeFactoryInterface,
  NodeInterface,
  OperatorKind,
  QueryAttributeType,
  Query,
  QuerySyntax,
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
  FullQueryInterface,
} from "../";

export class NodeFactory implements NodeFactoryInterface {
  createBaseNode<T extends NodeInterface>(kind: T["kind"]) {
    const node = new Node(kind);
    return node as T;
  }

  createUnaryExpression() {
    const node = this.createBaseNode<UnaryExpressionInterface>(QuerySyntax.UnaryExpression);

    return node;
  }

  createBinaryExpression() {
    const node = this.createBaseNode<BinaryExpressionInterface>(QuerySyntax.BinaryExpression);

    return node;
  }

  createTernaryExpression() {
    const node = this.createBaseNode<TernaryExpressionInterface>(QuerySyntax.TernaryExpression);

    return node;
  }

  createLogicalExpression() {
    const node = this.createBaseNode<LogicalExpressionInterface>(QuerySyntax.LogicalExpression);
    node.operator = QuerySyntax.AndKeyword;
    node.expressions = [];

    return node;
  }

  addExpressionToLogicalExpression(
    logicalExpression: LogicalExpressionInterface,
    expression: ExpressionInterface) {
    logicalExpression.expressions.push(expression);
  }

  updateLogicalExpressionOperatorToAnd(
    logicalExpression: LogicalExpressionInterface) {
    logicalExpression.operator = QuerySyntax.AndKeyword;
  }

  updateLogicalExpressionOperatorToOr(
    logicalExpression: LogicalExpressionInterface) {
    logicalExpression.operator = QuerySyntax.OrKeyword;
  }

  createAttributeExpressionNode(
    attribute: string,
    operator: OperatorKind,
    type: QueryAttributeType,
    value: any,
    parent?: NodeInterface) {

    let node;
    let nodeLHS;
    let nodeRHS;

    if (operator == QuerySyntax.ExistKeyword || operator == QuerySyntax.DoesNotExistKeyword) {
      node = this.createUnaryExpression();
    }
    else {
      node = this.createBinaryExpression(); 
    }

    node.operator = operator;
    node.left = this.createAttributeNode(attribute, type);
    
    if (node.kind == QuerySyntax.BinaryExpression) {
      node.right = this.createValueNode(value, type);
    }

    return node;
  }

  createEventExpressionNode(
    event: string,
    operator: OperatorKind,
    count: number,
    attributes?: ExpressionInterface[],
    parent?: NodeInterface) {
    // const node = this.createBaseNode<EventExpressionInterface>(QuerySyntax.EventExpression);
    const node = this.createBinaryExpression();

    const nodeLHS = this.createEventNode(event);
    const nodeRHS = this.createValueNode(count);
    node.operator = operator;
    node.left = nodeLHS;
    node.right = nodeRHS;

    return node;
  }

  createAttributeNode(attribute: string, type: QueryAttributeType) {
    const node = this.createBaseNode<AttributeNodeInterface>(QuerySyntax.AttributeNode);
    node.attribute = attribute;
    node.prefix = "user_attributes";
    node.type = type;
    
    return node;
  }

  createEventNode(event: string) {
    const node = this.createBaseNode<EventNodeInterface>(QuerySyntax.EventNode);
    node.event = event;
    node.prefix = "payload";
    
    return node;
  }

  createValueNode(value: any, type?: QueryAttributeType) {
    const node = this.createBaseNode<ValueNodeInterface>(QuerySyntax.ValueNode);
    node.value = value;
    node.type = type;

    return node;
  }

  createFullQuery(query: Query) {
    const node = this.createBaseNode<FullQueryInterface>(QuerySyntax.FullQuery);
    node.query = query;

    return node;
  }
}

