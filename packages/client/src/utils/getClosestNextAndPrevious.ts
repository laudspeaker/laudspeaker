import {
  getIncomersCustom,
  getOutgoersCustom,
} from "pages/FlowBuilderv2/search.helper";
import { Edge, Node } from "reactflow";

const getClosestNextAndPrevious = <T>(
  node: Node<T>,
  nodes: Node<T>[],
  edges: Edge[]
): Node<T>[] => {
  const inNodes = getIncomersCustom(node, nodes, edges);
  const outNodes = getOutgoersCustom(node, nodes, edges);

  return [...inNodes, ...outNodes];
};

export default getClosestNextAndPrevious;
