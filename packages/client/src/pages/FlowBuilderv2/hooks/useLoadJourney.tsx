import { useState } from "react";
import ApiService from "services/api.service";
import { Edge, Node } from "reactflow";
import { useParams } from "react-router-dom";
import { NodeData, Stats } from "../Nodes/NodeData";
import { EdgeData } from "../Edges/EdgeData";
import {
  JourneyEntrySettings,
  JourneySettings,
  JourneyType,
  loadVisualLayout,
  SegmentsSettings,
  selectNode,
  setFlowId,
  setFlowName,
  setFlowStatus,
  setIsViewMode,
  setJourneyEntrySettings,
  setJourneySettings,
  setJourneyType,
  setSegmentsSettings,
} from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import { NodeType } from "../FlowEditor";

const nodesToLoadCustomerCount: NodeType[] = [
  NodeType.WAIT_UNTIL,
  NodeType.TIME_DELAY,
  NodeType.TIME_WINDOW,
];

export enum LoadJourneyMode {
  VIEW_VERSION = "viewVersion",
  VIEW_JOURNEY = "viewJourney",
}

interface loadJourneyInterface {
  setInitialSegmentSettings?: (segments: SegmentsSettings) => void;
  setInitialJourneyEntrySettings?: (settings: JourneyEntrySettings) => void;
  setInitialJourneySettings?: (settings: JourneySettings) => void;
  mode?: LoadJourneyMode;
}

const useLoadJourney = ({
  setInitialSegmentSettings,
  setInitialJourneyEntrySettings,
  setInitialJourneySettings,
  mode,
}: loadJourneyInterface) => {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(true);

  const isViewJourney = mode === LoadJourneyMode.VIEW_VERSION;

  const loadJourney = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{
        name: string;
        nodes: Node<NodeData>[];
        edges: Edge<EdgeData>[];
        segments: SegmentsSettings;
        isDynamic: boolean;
        isActive?: boolean;
        isPaused?: boolean;
        isStopped?: boolean;
        isDeleted?: boolean;
        isEnrolling?: boolean;
        journeyEntrySettings: JourneyEntrySettings;
        journeySettings: JourneySettings;
      }>({
        url: "/journeys/" + id,
      });

      dispatch(setFlowName(data.name));
      if (
        data.nodes.length !== 0 &&
        data.nodes.some((node) => node.type === NodeType.START)
      ) {
        const stepIdsToLoadCustomerCount: string[] = [];

        const updatedNodesWithStats = await Promise.all(
          data.nodes.map(async (node) => {
            if (
              nodesToLoadCustomerCount.includes(node.type as NodeType) &&
              node.data.stepId
            ) {
              stepIdsToLoadCustomerCount.push(node.data.stepId);
            }

            if (
              !node.data.stepId ||
              (node.type !== NodeType.MESSAGE &&
                node.type !== NodeType.TRACKER &&
                node.type !== NodeType.PUSH)
            )
              return { ...node };

            try {
              const { data: stats } = await ApiService.get<Stats>({
                url: "/steps/stats/" + node.data.stepId,
              });

              return { ...node, data: { ...node.data, stats } };
            } catch (e) {
              return { ...node };
            }
          })
        );

        try {
          const { data: bulkCustomersCount } = await ApiService.post<number[]>({
            url: "/customers/count/bulk",
            options: {
              stepIds: stepIdsToLoadCustomerCount,
            },
          });

          for (let i = 0; i < stepIdsToLoadCustomerCount.length; i++) {
            const node = updatedNodesWithStats.find(
              (n) => n.data.stepId === stepIdsToLoadCustomerCount[i]
            );
            if (!node) continue;

            node.data.customersCount = bulkCustomersCount[i];
          }
        } catch (e) {
          console.error("Failed to load customer count", e);
        }

        dispatch(
          loadVisualLayout({
            nodes: updatedNodesWithStats,
            edges: data.edges,
          })
        );
      }

      const firstMessageNode = data.nodes.find(
        (node) => node.type === NodeType.MESSAGE
      );

      if (firstMessageNode) {
        dispatch(selectNode(firstMessageNode.id));
      }

      if (
        !isViewJourney &&
        setInitialSegmentSettings &&
        setInitialJourneyEntrySettings &&
        setInitialJourneySettings
      ) {
        dispatch(setSegmentsSettings(data.segments));
        setInitialSegmentSettings(data.segments);
        dispatch(
          setJourneyType(
            data.isDynamic ? JourneyType.DYNAMIC : JourneyType.STATIC
          )
        );
        dispatch(setJourneyEntrySettings(data.journeyEntrySettings));
        setInitialJourneyEntrySettings(data.journeyEntrySettings);
        dispatch(setJourneySettings(data.journeySettings));
        setInitialJourneySettings(data.journeySettings);
      }

      dispatch(setFlowId(id));
      let status: JourneyStatus = JourneyStatus.DRAFT;

      if (data.isActive) {
        if (data.isEnrolling) status = JourneyStatus.ENROLLING;
        else status = JourneyStatus.ACTIVE;
      }
      if (data.isPaused) status = JourneyStatus.PAUSED;
      if (data.isStopped) status = JourneyStatus.STOPPED;
      if (data.isDeleted) status = JourneyStatus.DELETED;

      dispatch(setFlowStatus(status));
    } finally {
      setIsLoading(false);
      dispatch(setIsViewMode(true));
    }
  };

  return { loadJourney, isLoading };
};

export default useLoadJourney;
