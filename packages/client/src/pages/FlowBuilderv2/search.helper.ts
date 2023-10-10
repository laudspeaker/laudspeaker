import { Edge, getOutgoers, getIncomers, Node } from "reactflow";
import { NodeType } from "./FlowEditor";

export const getOutgoersCustom = <T>(
  node: Node,
  nodes: Node[],
  edges: Edge[]
): Node[] => {
  const out = getOutgoers(node, nodes, edges);

  // need custom select to retrieve outgoers of jumpTo
  if (node.type === "jumpTo") {
    const nd = nodes.find((el) => el.id === node.data.targetId);
    if (!nd) {
      return [];
    }
    return [nd];
  }

  return [...out];
};

export const getIncomersCustom = <T>(
  node: Node,
  nodes: Node[],
  edges: Edge[]
): Node[] => {
  const out = getIncomers(node, nodes, edges);

  const allIncomersJumpTo = nodes.filter(
    (el) => el.data.targetId === node.id && el.type === NodeType.JUMP_TO
  );

  return [...out, ...allIncomersJumpTo];
};
