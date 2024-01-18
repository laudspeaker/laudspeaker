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

const nodeTypesWithPossibleStats: string[] = [
  NodeType.MESSAGE,
  NodeType.TRACKER,
];

const nodeTypeHeightMap: Record<NodeType, number> = {
  [NodeType.EMPTY]: 80,
  [NodeType.EXIT]: 60,
  [NodeType.INSERT_NODE]: 80,
  [NodeType.JUMP_TO]: 60,
  [NodeType.MESSAGE]: 80,
  [NodeType.START]: 60,
  [NodeType.TIME_DELAY]: 80,
  [NodeType.TIME_WINDOW]: 80,
  [NodeType.TRACKER]: 80,
  [NodeType.USER_ATTRIBUTE]: 80,
  [NodeType.WAIT_UNTIL]: 80,
  [NodeType.MULTISPLIT]: 80,
  [NodeType.EXPERIMENT]: 80,
  [NodeType.PUSH]: 80,
};

const STATS_HEIGHT = 60;
const VERTICAL_GAP_BETWEEN_NODES = 44;

export const applyLayoutCorrections = (
  rootNode: Node,
  nodes: Node[],
  edges: Edge[]
) => {
  const children = getOutgoers(rootNode, nodes, edges);

  const rootHeight = nodeTypeHeightMap[rootNode.type as NodeType] || 0;

  for (const child of children) {
    const childHeight =
      (nodeTypeHeightMap[child.type as NodeType] || 0) +
      (child.data.stats ? STATS_HEIGHT : 0);

    translateTree(child, nodes, edges, {
      x: 0,
      y:
        (rootHeight + childHeight) / 2 +
        VERTICAL_GAP_BETWEEN_NODES +
        (children.length > 1 ? 2 * VERTICAL_GAP_BETWEEN_NODES : 0),
    });

    const childOutgoers = getOutgoers(child, nodes, edges);

    if (
      child.type &&
      child.data.stats &&
      childOutgoers.length === 1 &&
      nodeTypesWithPossibleStats.includes(child.type)
    ) {
      translateTree(childOutgoers[0], nodes, edges, {
        x: 0,
        y: STATS_HEIGHT / 2,
      });
    }

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
    .nodeSize([260, 0])
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
