import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  Edge,
  EdgeChange,
  getIncomers,
  getOutgoers,
  MarkerType,
  Node,
  NodeChange,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import { setEdges, setNodes } from "reducers/flow-builder.reducer";
import {
  EmptyNode,
  JumpToNode,
  MessageNode,
  StartNode,
  TimeDelayNode,
  TimeWindowNode,
  WaitUntilNode,
} from "./Nodes";
import FlowBuilderSidePanel from "./SidePanel/FlowBuilderSidePanel";
import { PrimaryEdge } from "./Edges";
import { hierarchy, HierarchyNode, tree } from "d3-hierarchy";
import NodeData from "./Nodes/NodeData";

export enum NodeType {
  START = "start",
  EMPTY = "empty",
  MESSAGE = "message",
  JUMP_TO = "jumpTo",
  WAIT_UNTIL = "waitUntil",
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
}

export enum EdgeType {
  PRIMARY = "primary",
}

const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.EMPTY]: EmptyNode,
  [NodeType.MESSAGE]: MessageNode,
  [NodeType.JUMP_TO]: JumpToNode,
  [NodeType.WAIT_UNTIL]: WaitUntilNode,
  [NodeType.TIME_DELAY]: TimeDelayNode,
  [NodeType.TIME_WINDOW]: TimeWindowNode,
};

const edgeTypes = {
  [EdgeType.PRIMARY]: PrimaryEdge,
};

interface HierarchyObject {
  id: string;
  children?: HierarchyObject[];
}

const retrieveHierarchyObject = (
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

const FlowEditor = () => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);

  const dispatch = useAppDispatch();

  const onNodesChange = (changes: NodeChange[]) => {
    changes = changes.filter(
      (change) =>
        change.type === "select" &&
        nodes.find((node) => node.id === change.id)?.type !== NodeType.EMPTY
    );

    dispatch(setNodes(applyNodeChanges(changes, nodes)));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    changes = changes.filter((change) => change.type === "select");
    dispatch(setEdges(applyEdgeChanges(changes, edges)));
  };

  useEffect(() => {
    const rootNode = nodes.find(
      (node) =>
        getIncomers(node, nodes, edges).length === 0 &&
        node.type === NodeType.START
    );

    if (rootNode) {
      const root = hierarchy(retrieveHierarchyObject(rootNode, nodes, edges));
      const treeLayout = tree<HierarchyObject>();
      treeLayout.nodeSize([260, 160]);

      const layoutedNodes = treeLayout(root).each(() => {});

      // dispatch(setNodes(nodes));
    }
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-full bg-[#F3F4F6] text-[#111827] flex">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={[0.5, 0.5]}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.Arrow },
        }}
        fitView
      >
        <Controls showInteractive={false} position="top-left" />
      </ReactFlow>
      <FlowBuilderSidePanel />
    </div>
  );
};

export default FlowEditor;
