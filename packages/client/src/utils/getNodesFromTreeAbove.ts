import { Edge, getIncomers, Node } from "reactflow";

const getNodesFromTreeAbove = <T>(
  node: Node<T>,
  nodes: Node<T>[],
  edges: Edge[]
): Node<T>[] => {
  if (!nodes.includes(node)) return [];

  const incomers = getIncomers(node, nodes, edges);

  return [
    ...incomers,
    ...incomers
      .map((incomer) => getNodesFromTreeAbove<T>(incomer, nodes, edges))
      .reduce((acc, el) => [...acc, ...el], []),
  ];
};

export default getNodesFromTreeAbove;
