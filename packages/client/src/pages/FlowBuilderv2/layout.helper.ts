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
  nodes: Node[]
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
      ...retrieveNodesFromHierarchyObject(item, newNodes),
    ],
    []
  );

  return [newNode, ...anotherNodes];
};

export const translateTree = (
  treeRoot: Node,
  nodes: Node[],
  edges: Edge[],
  offset: { x: number; y: number }
) => {
  treeRoot.position.x += offset.x;
  treeRoot.position.y += offset.y;

  const outgoers = getOutgoers(treeRoot, nodes, edges);

  for (const child of outgoers) {
    translateTree(child, nodes, edges, offset);
  }
};

const NODE_WIDTH = 260;
const HORIZONTAL_OFFSET = 45;

export const applyLayoutCorrections = (
  rootNode: Node,
  nodes: Node[],
  edges: Edge[]
) => {
  const children = getOutgoers(rootNode, nodes, edges);

  if (children.length > 1) {
    // const widthOffsetSum = NODE_WIDTH + HORIZONTAL_OFFSET;
    // const globalOffset = -widthOffsetSum * (children.length - 1) * 0.5;

    for (let i = 0; i < children.length; i++) {
      translateTree(children[i], nodes, edges, {
        // x: widthOffsetSum * i + globalOffset,
        x: 0,
        y: 145,
      });
    }
  }

  for (const child of children) {
    applyLayoutCorrections(child, nodes, edges);
  }
};

export const getLayoutedNodes = (nodes: Node[], edges: Edge[]) => {
  let rootNode = nodes.find(
    (node) =>
      getIncomers(node, nodes, edges).length === 0 &&
      node.type === NodeType.START
  );
  if (!rootNode) return nodes;

  const root = hierarchy(retrieveHierarchyObject(rootNode, nodes, edges));
  const treeLayout = tree<HierarchyObject>()
    .nodeSize([260, 125])
    .separation(() => 2);

  const layoutedNodes = treeLayout(root);

  nodes = retrieveNodesFromHierarchyObject(layoutedNodes, nodes);

  rootNode = nodes.find(
    (node) =>
      getIncomers(node, nodes, edges).length === 0 &&
      node.type === NodeType.START
  );
  if (!rootNode) return nodes;

  applyLayoutCorrections(rootNode, nodes, edges);

  return nodes;
};
