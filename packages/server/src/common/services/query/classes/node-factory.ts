import { 
  CustomerAttributeNodeInterface,
  BinaryExpressionInterface,
  EventNodeInterface,
  EventOperatorKind,
  ExpressionInterface,
  ExpressionInterfaces,
  ExpressionInterfaceType,
  FullQueryInterface,
  LogicalExpressionInterface,
  Node,
  NodeFactoryInterface,
  NodeInterface,
  OperatorKind,
  Query,
  QueryAttributeType,
  QuerySyntax,
  TernaryExpressionInterface,
  UnaryExpressionInterface,
  ValueNodeInterface,
  ResolvedNodeInterface,
  ResolvedCustomerAttributeNodeInterface,
  ResolvedEventNodeInterface,
  AttributeInterface,
  ResolvableNodeType,
  AggregatedNodeData,
} from "../";

export class NodeFactory implements NodeFactoryInterface {
  createBaseNode<T extends NodeInterface>(
    kind: T["kind"],
    parent?: any) {
    const node = new Node(kind);

    node.parent = parent ?? undefined;
    node.resolvedNode = undefined;
    node.aggregatedData = {
      distinctEvents: new Set<string>(),
      distinctAttributes: new Set<string>(),
    };

    return node;
  }

  createBaseResolvedNode<T extends ResolvedNodeInterface>(
    kind: T["kind"],
    parent: ResolvableNodeType
  ) {
    // const node = this.createBaseNode<T>(kind, parent);
    const node = new Node(kind, parent);
    return node;
  }

  createUnaryExpression(): UnaryExpressionInterface {
    const node = this.createBaseNode<UnaryExpressionInterface>(QuerySyntax.UnaryExpression);

    return node;
  }

  createBinaryExpression(): BinaryExpressionInterface {
    const node = this.createBaseNode<BinaryExpressionInterface>(QuerySyntax.BinaryExpression);

    return node;
  }

  createTernaryExpression(): TernaryExpressionInterface {
    const node = this.createBaseNode<TernaryExpressionInterface>(QuerySyntax.TernaryExpression);

    return node;
  }

  createLogicalExpression(): LogicalExpressionInterface {
    const node = this.createBaseNode<LogicalExpressionInterface>(QuerySyntax.LogicalExpression);
    node.operator = QuerySyntax.AndKeyword;
    node.expressions = [];

    return node;
  }

  addExpressionToLogicalExpression(
    logicalExpression: LogicalExpressionInterface,
    expression: ExpressionInterfaces) {
    logicalExpression.expressions.push(expression);
  }

  updateExpressionOperator(
    expression: ExpressionInterface,
    operator: OperatorKind) {
      expression.operator = operator;
  }

  createCustomerAttributeExpressionNode(
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
    node.left = this.createCustomerAttributeNode(attribute, type);
    
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

  createCustomerAttributeNode(attribute: string, type: QueryAttributeType) {
    const node = this.createBaseNode<CustomerAttributeNodeInterface>(QuerySyntax.CustomerAttributeNode);
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

  createResolvedCustomerAttributeNode(
    attribute: AttributeInterface,
    operator: OperatorKind,
    value: any,
    parent: ResolvableNodeType
  ): ResolvedCustomerAttributeNodeInterface {
    const node = this.createBaseResolvedNode<ResolvedCustomerAttributeNodeInterface>(
      QuerySyntax.ResolvedCustomerAttributeNode,
      parent);
    node.operator = operator;
    node.attribute = attribute;
    node.value = value;
    
    return node;
  }

  createResolvedEventNode(
    event: string,
    operator: OperatorKind,
    count: number,
    parent: ResolvableNodeType,
    attributes?: any
  ): ResolvedEventNodeInterface {
    const node = this.createBaseResolvedNode<ResolvedEventNodeInterface>(
      QuerySyntax.ResolvedEventNode,
      parent);
    node.operator = operator;
    node.event = event;
    node.count = count;
    
    return node;
  }

  updateNodeAggregatedData(node: NodeInterface, data: AggregatedNodeData) {
    // node.aggregatedData.distinctEvents = node.aggregatedData.distinctEvents.union(data.distinctEvents);
    // node.aggregatedData.distinctAttributes = node.aggregatedData.distinctAttributes.union(data.distinctAttributes);
  }
}

