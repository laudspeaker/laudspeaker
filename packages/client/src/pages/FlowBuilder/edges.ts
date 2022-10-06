import { Edge, MarkerType } from "react-flow-renderer";

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.Arrow,
    },
    style: { strokeWidth: "2px" },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "smoothstep",
    style: { strokeWidth: "2px" },
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: "e3-4",
    source: "2",
    target: "4",
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.Arrow,
    },
    style: { strokeWidth: "2px" },
  },
];

export default initialEdges;
