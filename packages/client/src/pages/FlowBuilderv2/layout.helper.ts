import { hierarchy, HierarchyPointNode, tree } from "d3-hierarchy";
import { Edge, getIncomers, getOutgoers, Node } from "reactflow";
import { NodeType } from "./FlowEditor";
import { NodeData } from "./Nodes/NodeData";

export interface HierarchyObject {
  id: string;
  children?: HierarchyObject[];
}

export const retrieveHierarchyObject = (
  root: Node,
  nodes: Node[],
  edges: Edge[]
): HierarchyObject => {
  const children = getOutgoers(root, nodes, edges);

  return {
    id: root.id,
    ...(children.length > 0
      ? {
          children: children.map((child) =>
            retrieveHierarchyObject(child, nodes, edges)
          ),
        }
      : {}),
  };
};

export const retrieveNodesFromHierarchyObject = (
  object: HierarchyPointNode<HierarchyObject>,
  nodes: Node[],
  previousNode?: Node
): Node[] => {
  const {
    data: { id },
    x,
    y,
    children,
  } = object;

  const nodeToChangeIndex = nodes.findIndex((node) => node.id === id);
  const nodeToChange = nodes[nodeToChangeIndex];

  if (!nodeToChange) return [];
  const newNodes = [...nodes];

  const newNode: Node<NodeData> = {
    ...nodeToChange,
    position: { x, y },
  };

  newNodes[nodeToChangeIndex] = newNode;

  if (!children) return [newNode];

  const anotherNodes = children.reduce<Node<NodeData>[]>(
    (acc, item) => [
      ...acc,
      ...retrieveNodesFromHierarchyObject(item, newNodes, newNode),
    ],
    []
  );

  return [newNode, ...anotherNodes];
};

export const getLayoutedNodes = (nodes: Node[], edges: Edge[]) => {
  const rootNode = nodes.find(
    (node) =>
      getIncomers(node, nodes, edges).length === 0 &&
      node.type === NodeType.START
  );

  if (!rootNode) return nodes;

  const root = hierarchy(retrieveHierarchyObject(rootNode, nodes, edges));
  const treeLayout = tree<HierarchyObject>();
  treeLayout.nodeSize([260, 125]);

  const layoutedNodes = treeLayout(root);

  return retrieveNodesFromHierarchyObject(layoutedNodes, nodes);
};
