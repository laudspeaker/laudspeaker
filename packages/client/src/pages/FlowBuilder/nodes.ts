import { Node } from "react-flow-renderer";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "special",
    data: { label: "Input Node", title: "sample", subtitle: "sample sub" },
    position: { x: 250, y: 25 },
  },

  {
    id: "2",
    // you can also pass a React component as a label
    type: "special",
    data: { label: "Default node", title: "Example", subtitle: "example sub" },
    position: { x: 100, y: 225 },
  },
  {
    id: "3",
    type: "special",
    data: { label: "Output Node", title: "sample 1", subtitle: "sample sub 1" },
    position: { x: 600, y: 225 },
  },
  {
    id: "4",
    position: { x: 600, y: 450 },
    type: "special",
    data: {
      label: "Another node",
      title: "independent node",
      subtitle: "sample sub",
    },
  },
];

export default initialNodes;
