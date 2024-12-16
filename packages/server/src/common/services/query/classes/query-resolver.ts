import {
  Query,
  QuerySyntax,
  QuerySQL,
  QueryData,
  QueryResolverFlags,
  QueryResolverInterface,
  NodeInterface,
  CustomerAttributeNodeInterface,
  EventNodeInterface,
  ValueNodeInterface,
  UnaryExpressionInterface,
  BinaryExpressionInterface,
  TernaryExpressionInterface,
  LogicalExpressionInterface,
  ExpressionHelper,
  ExpressionInterfaceType,
  ExpressionInterface,
  QueryFlags,
  NodeFactory,
  ResolvedNodeInterface,
  ResolvedCustomerAttributeNodeInterface,
  ResolvedEventNodeInterface,
} from "../";

// used to traverse the full query to generate supporting data
// in order to execute or return SQL
export class QueryResolver implements QueryResolverInterface {
  nodeFactory = new NodeFactory();

  private query: Query;
  private queryData: QueryData;

  resolve(query: Query) {
    this.init(query);
    this.traverseTree();
  }

  private init(query: Query) {
    this.query = query;

    this.initQueryData();
  }

  private initQueryData() {
    this.queryData = {
      query: this.query,
      context: this.query.context,

      customerAttributes: [],
      eventSearchCriteria: [],
      distinctEvents: new Set<string>,

      flags: QueryFlags.None,

      selectValues: [],
      tables: [],
      condition: '',
    };
  }

  private traverseTree() {
    this.processNode(this.query.getRootExpression());
  }

  private processNode(node: NodeInterface, parent: NodeInterface | undefined = undefined) {
    if(!node)
      return;

    switch(node.kind) {
      case QuerySyntax.CustomerAttributeNode:
        return this.processCustomerAttributeNode(node as CustomerAttributeNodeInterface);
      case QuerySyntax.EventNode:
        return this.processEventNode(node as EventNodeInterface, parent);
      case QuerySyntax.ValueNode:
        return this.processValueNode(node as ValueNodeInterface);
      case QuerySyntax.UnaryExpression:
        return this.processUnaryExpressionNode(node as UnaryExpressionInterface);
      case QuerySyntax.BinaryExpression:
        return this.processBinaryExpressionNode(node as BinaryExpressionInterface);
      case QuerySyntax.TernaryExpression:
        return this.processTernaryExpressionNode(node as TernaryExpressionInterface);
      case QuerySyntax.LogicalExpression:
        return this.processLogicalExpressionNode(node as LogicalExpressionInterface);
      case QuerySyntax.EmailExpression:
      case QuerySyntax.MessageExpression:
      case QuerySyntax.SMSExpression:
      case QuerySyntax.PushExpression:
        return;
      default:
        // node satisfies never;
        throw new Error("Invalid kind");
    }
  }

  private processCustomerAttributeNode(node: CustomerAttributeNodeInterface) {
    this.queryData.customerAttributes.push(node.attribute);
  }

  private processEventNode(node: EventNodeInterface, parent: NodeInterface | undefined = undefined) {
    let count;

    if (parent.kind == QuerySyntax.BinaryExpression) {
      count = this.processNode( (parent as BinaryExpressionInterface).right);
      // count = parent.right?.kind == QuerySyntax.ValueNode ? 
    }
    this.queryData.eventSearchCriteria.push({
      event: node.event,
      count: count,
    });

    this.queryData.distinctEvents.add(node.event);
  }

  private processValueNode(node: ValueNodeInterface) {
    return node.value;
  }

  private processUnaryExpressionNode(node: UnaryExpressionInterface) {
    this.processNode(node.left);
  }

  private processBinaryExpressionNode(node: BinaryExpressionInterface) {
    const lhs = this.processNode(node.left);
    this.processNode(node.right);

    // const lhs: QueryParsedExpression
  }

  private processTernaryExpressionNode(node: TernaryExpressionInterface) {
    this.processNode(node.left);
    this.processNode(node.middle);
    this.processNode(node.right);
  }

  private processLogicalExpressionNode(node: LogicalExpressionInterface) {
    for(let expression of node.expressions) {
      this.processNode(expression);
    }
  }

}

