import React, { useCallback } from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  EdgeChange,
  NodeChange,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import { setEdges, setNodes } from "reducers/flow-builder.reducer";

const FlowEditor = () => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const onNodesChange = (changes: NodeChange[]) =>
    dispatch(setNodes(applyNodeChanges(changes, nodes)));
  const onEdgesChange = (changes: EdgeChange[]) =>
    dispatch(setEdges(applyEdgeChanges(changes, edges)));

  return (
    <div className="relative w-full h-full bg-[#F3F4F6] text-[#111827]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
      </ReactFlow>

      <div className="absolute top-[17px] left-[6px] w-[95px] h-[30px]">
        <select
          className="w-full h-full border-[1px] border-[#E5E7EB] p-[8px] font-medium text-[12px] leading-[14px] rounded-[4px]"
          value="100%"
        >
          <option value="100%">100%</option>
        </select>
      </div>
    </div>
  );
};

export default FlowEditor;
