import { getOutgoersCustom } from "pages/FlowBuilderv2/search.helper";
import { Edge, getIncomers, Node } from "reactflow";

const getClosestNextAndPrevious = <T>(
  node: Node<T>,
  nodes: Node<T>[],
  edges: Edge[]
): Node<T>[] => {
  const inNodes = getIncomers(node, nodes, edges);
  const outNodes = getOutgoersCustom(node, nodes, edges);

  return [...inNodes, ...outNodes];
};

export default getClosestNextAndPrevious;
