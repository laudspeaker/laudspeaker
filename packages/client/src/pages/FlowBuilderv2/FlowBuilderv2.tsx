import React, { useEffect, useState } from "react";
import FlowBuilderDrawer from "./Drawer/FlowBuilderDrawer";
import FlowBuilderHeader from "./Header/FlowBuilderHeader";
import FlowEditor from "./FlowEditor";
import { useThrottle } from "react-use";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowBuilderSegmentEditor from "./FlowBuilderSegmentEditor";
import FlowBuilderReview from "./FlowBuilderReview";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { MessageNodeData, NodeData } from "./Nodes/NodeData";
import { Edge, Node } from "reactflow";
import { EdgeData } from "./Edges/EdgeData";
import {
  clearSegmentPanelErrors,
  JourneyEntrySettings,
  JourneySettings,
  JourneyType,
  loadVisualLayout,
  SegmentsSettings,
  setAvailableTags,
  setFlowId,
  setFlowName,
  setJourneyEntrySettings,
  setJourneySettings,
  setJourneyType,
  setNodes,
  setSegmentsSettings,
  setShowSegmentsErrors,
} from "reducers/flow-builder.reducer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import { NodeType } from "./FlowEditor";
import { SocketProvider } from "./useDevSocketConnection";
import FlowBuilderSettings from "./FlowBuilderSettings";
import { capitalize } from "lodash";

const FlowBuilderv2 = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useAppDispatch();
  const flowBuilderState = useAppSelector((state) => state.flowBuilder);

  const throttledFlowBuilderState = useThrottle(flowBuilderState, 1000);

  const loadAllTags = async () => {
    try {
      const { data } = await ApiService.get<string[]>({
        url: "/journeys/tags",
      });

      dispatch(setAvailableTags(data));
    } catch (error) {
      dispatch(setAvailableTags([]));
    }
  };

  const loadJourney = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{
        name: string;
        nodes: Node<NodeData>[];
        edges: Edge<EdgeData>[];
        segments: SegmentsSettings;
        isDynamic: boolean;
        isActive: boolean;
        isPaused: boolean;
        isStopped: boolean;
        isDeleted: boolean;
        journeyEntrySettings?: JourneyEntrySettings;
        journeySettings?: JourneySettings;
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
      dispatch(setShowSegmentsErrors(false));
      dispatch(clearSegmentPanelErrors());
      dispatch(
        setJourneyEntrySettings(data?.journeyEntrySettings || undefined)
      );
      dispatch(setJourneySettings(data?.journeySettings || undefined));
      dispatch(setFlowId(id));

      let status: JourneyStatus = JourneyStatus.DRAFT;

      if (data.isActive) status = JourneyStatus.ACTIVE;
      if (data.isPaused) status = JourneyStatus.PAUSED;
      if (data.isStopped) status = JourneyStatus.STOPPED;
      if (data.isDeleted) status = JourneyStatus.DELETED;

      if (status !== JourneyStatus.DRAFT) navigate(`/flow/${id}/view`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJourney();
  }, []);

  useEffect(() => {
    loadAllTags();
  }, [flowBuilderState.stepperIndex]);

  const handleSaveLayout = async () => {
    try {
      await ApiService.patch({
        url: "/journeys/visual-layout",
        options: {
          id,
          nodes: throttledFlowBuilderState.nodes,
          edges: throttledFlowBuilderState.edges,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save layout");
    }
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
        journeyEntrySettings: throttledFlowBuilderState.journeyEntrySettings,
        journeySettings: throttledFlowBuilderState.journeySettings,
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
    throttledFlowBuilderState.journeyEntrySettings,
    throttledFlowBuilderState.journeySettings,
  ]);

  useEffect(() => {
    if (
      flowBuilderState.nodes.some(
        (node) =>
          !(node.data as MessageNodeData)?.customName && node.type == "message"
      )
    ) {
      let messageCount = 1;
      dispatch(
        setNodes(
          flowBuilderState.nodes.map((node) => {
            if (node.type == "message") {
              return {
                ...node,
                data: {
                  ...node.data,
                  customName: `${capitalize(
                    (node.data as MessageNodeData).template.type
                  )} ${messageCount++}`,
                },
              };
            }
            return node;
          })
        )
      );
    }
  }, [flowBuilderState]);

  return (
    <SocketProvider>
      <div className="relative w-full h-full">
        <FlowBuilderHeader />
        <div className="relative flex w-full h-full max-h-[calc(100%-60px)]">
          {flowBuilderState.stepperIndex === 0 && <FlowBuilderDrawer />}

          {flowBuilderState.stepperIndex === 0 ? (
            <FlowEditor />
          ) : flowBuilderState.stepperIndex === 1 ? (
            <FlowBuilderSegmentEditor />
          ) : flowBuilderState.stepperIndex === 2 ? (
            <FlowBuilderSettings />
          ) : (
            <FlowBuilderReview />
          )}
        </div>
      </div>
    </SocketProvider>
  );
};

export default FlowBuilderv2;
