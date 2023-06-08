import React, { useEffect, useState } from "react";
import FlowBuilderDrawer from "./Drawer/FlowBuilderDrawer";
import FlowBuilderHeader from "./Header/FlowBuilderHeader";
import FlowEditor, { NodeType } from "./FlowEditor";
import { useThrottle } from "react-use";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderSegmentEditor from "./FlowBuilderSegmentEditor";
import FlowBuilderReview from "./FlowBuilderReview";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { NodeData } from "./Nodes/NodeData";
import { Edge, Node } from "reactflow";
import { EdgeData } from "./Edges/EdgeData";
import {
  JourneyType,
  loadVisualLayout,
  SegmentsSettings,
  setEdges,
  setFlowId,
  setFlowName,
  setJourneyType,
  setNodes,
  setSegmentsSettings,
} from "reducers/flow-builder.reducer";

const FlowBuilderv2 = () => {
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useAppDispatch();
  const flowBuilderState = useAppSelector((state) => state.flowBuilder);

  const throttledFlowBuilderState = useThrottle(flowBuilderState, 1000);

  const loadJourney = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{
        name: string;
        nodes: Node<NodeData>[];
        edges: Edge<EdgeData>[];
        segments: SegmentsSettings;
        isDynamic: boolean;
      }>({
        url: "/journeys/" + id,
      });

      dispatch(setFlowName(data.name));
      if (
        data.nodes.length !== 0 &&
        data.nodes.some((node) => node.type === NodeType.START)
      ) {
        dispatch(loadVisualLayout({ nodes: data.nodes, edges: data.edges }));
      }

      dispatch(setSegmentsSettings(data.segments));
      dispatch(
        setJourneyType(
          data.isDynamic ? JourneyType.DYNAMIC : JourneyType.STATIC
        )
      );
      dispatch(setFlowId(id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJourney();
  }, []);

  const handleSaveLayout = async () => {
    await ApiService.patch({
      url: "/journeys/visual-layout",
      options: {
        id,
        nodes: flowBuilderState.nodes,
        edges: flowBuilderState.edges,
      },
    });
  };

  useEffect(() => {
    if (!isLoading) handleSaveLayout();
  }, [
    throttledFlowBuilderState.flowId,
    throttledFlowBuilderState.nodes,
    throttledFlowBuilderState.edges,
  ]);

  const handleSaveProperties = async () => {
    await ApiService.patch({
      url: "/journeys",
      options: {
        id,
        name: throttledFlowBuilderState.flowName,
        inclusionCriteria: throttledFlowBuilderState.segments,
        isDynamic:
          throttledFlowBuilderState.journeyType === JourneyType.DYNAMIC,
      },
    });
  };

  useEffect(() => {
    if (!isLoading) handleSaveProperties();
  }, [
    throttledFlowBuilderState.flowId,
    throttledFlowBuilderState.flowName,
    throttledFlowBuilderState.segments,
    throttledFlowBuilderState.journeyType,
  ]);

  return (
    <div className="relative w-full h-full max-h-[calc(100%-46px)]">
      <FlowBuilderHeader />
      <div className="relative flex w-full h-full max-h-[calc(100%-60px)]">
        {flowBuilderState.stepperIndex === 0 && <FlowBuilderDrawer />}

        {flowBuilderState.stepperIndex === 0 ? (
          <FlowEditor />
        ) : flowBuilderState.stepperIndex === 1 ? (
          <FlowBuilderSegmentEditor />
        ) : (
          <FlowBuilderReview />
        )}
      </div>
    </div>
  );
};

export default FlowBuilderv2;
