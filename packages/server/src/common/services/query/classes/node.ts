import {
  NodeInterface,
  NodeFlags,
  QuerySyntax,
} from "../";

export class Node<T extends QuerySyntax> implements NodeInterface {
  public kind: T;
  public parent: NodeInterface;
  public flags: NodeFlags;

  constructor(kind: T) {
    this.kind = kind;
    this.parent = undefined!;
    this.flags = NodeFlags.None;
  }
}
