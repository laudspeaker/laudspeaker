import {
  NodeInterface,
  NodeFlags,
  QuerySyntax,
  AggregatedNodeData,
} from "../";

export class Node<T extends QuerySyntax> implements NodeInterface {
  public kind: T;
  public parent: NodeInterface;
  public flags: NodeFlags;

  public resolvedNode: NodeInterface;
  public aggregatedData: AggregatedNodeData;

  constructor(kind: T) {
    this.kind = kind;
    
    this.parent = undefined!;
    this.resolvedNode = undefined!;
    this.aggregatedData = {
      distinctEvents: new Set<string>(),
      distinctAttributes: new Set<string>(),
      eventFilters: [],
      customerAttributeFilters: [],
    };
    this.flags = NodeFlags.None;
  }
}
