import { Edge, getOutgoers, Node } from "reactflow";

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
