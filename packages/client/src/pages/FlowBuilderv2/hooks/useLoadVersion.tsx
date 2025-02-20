import { useState } from "react";
import ApiService from "services/api.service";
import { Edge, Node } from "reactflow";
import { useParams } from "react-router-dom";
import { NodeData, Stats } from "../Nodes/NodeData";
import { EdgeData } from "../Edges/EdgeData";
import {
  loadVisualLayout,
  selectNode,
  setFlowId,
  setIsViewMode,
} from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
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
  versionId?: string;
}

const useLoadVersion = ({ versionId }: loadJourneyInterface) => {
  const {
    id,
    journeyId: paramJourneyId,
    versionId: paramVersionId,
  } = useParams();

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const loadVersion = async () => {
    const journeyId = paramJourneyId || id;
    const versionUuid = paramVersionId || versionId;

    if (!journeyId || !versionUuid) return;

    setIsLoading(true);
    try {
      const { data } = await ApiService.get<{
        visual_layout: { nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] };
        name: string;
      }>({
        url: `journeys/${journeyId}/versions/${versionUuid}`,
      });

      if (!data.visual_layout?.nodes) return;

      if (
        data.visual_layout?.nodes.length !== 0 &&
        data.visual_layout?.nodes.some((node) => node.type === NodeType.START)
      ) {
        const stepIdsToLoadCustomerCount: string[] = [];

        const updatedNodesWithStats = await Promise.all(
          data.visual_layout?.nodes.map(async (node) => {
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
            edges: data.visual_layout?.edges,
          })
        );
      }

      const firstMessageNode = data.visual_layout?.nodes.find(
        (node) => node.type === NodeType.MESSAGE
      );

      if (firstMessageNode) {
        dispatch(selectNode(firstMessageNode.id));
      }

      dispatch(setFlowId(journeyId));
    } finally {
      setIsLoading(false);
      dispatch(setIsViewMode(true));
    }
  };

  return { loadVersion, isLoading };
};

export default useLoadVersion;
