import Progress from "components/Progress";
import { EdgeData } from "pages/FlowBuilderv2/Edges/EdgeData";
import FilterViewer from "pages/FlowBuilderv2/FilterViewer/FilterViewer";
import FlowEditor, { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { NodeData, Stats } from "pages/FlowBuilderv2/Nodes/NodeData";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import React, { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { applyNodeChanges, Edge, Node, NodeChange } from "reactflow";
import {
  JourneyEntrySettings,
  JourneySettings,
  JourneyType,
  loadVisualLayout,
  QueryStatementType,
  QueryType,
  SegmentsSettings,
  SegmentsSettingsType,
  selectNode,
  setFlowId,
  setFlowName,
  setFlowStatus,
  setIsViewMode,
  setJourneyEntrySettings,
  setJourneySettings,
  setJourneyType,
  setNodes,
  setSegmentsSettings,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import FlowViewerHeader from "./Header/FlowViewerHeader";
import FlowViewerSidePanel from "./SidePanel/FlowViewerSidePanel";
import FlowBuilderSegmentEditor from "pages/FlowBuilderv2/FlowBuilderSegmentEditor";
import FlowBuilderSettings from "pages/FlowBuilderv2/FlowBuilderSettings";
import FlowViewerChangeSegmentModal, {
  ChangeSegmentOption,
} from "./Modals/FlowViewerChangeSegmentModal";
import FlowViewerCancelConfirmationModal from "./Modals/FlowViewerCancelConfirmationModal";
import JourneyEntrySettingsViewer from "./JourneyEntrySettingsViewer";
import JourneySettingsViewer from "./JourneySettingsViewer";
import ActivityHistoryViewer from "./ActivityHistoryViewer";

export enum FlowViewerTab {
  JOURNEY = "Journey",
  ENTRY = "Entry",
  SETTINGS = "Settings",
  ACTIVITY_HISTORY = "Activity history",
}

const nodesToLoadCustomerCount: NodeType[] = [
  NodeType.WAIT_UNTIL,
  NodeType.TIME_DELAY,
  NodeType.TIME_WINDOW,
];

const FlowViewerv2 = () => {
  const { id } = useParams();
  const { state: locationState } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(FlowViewerTab.JOURNEY);
  const [onConfirmNextTab, setOnConfirmNextTab] = useState<FlowViewerTab>();

  const dispatch = useAppDispatch();

  const {
    journeyType,
    segments: segmentsSettings,
    journeyEntrySettings,
    journeySettings,
    nodes,
    flowStatus,
  } = useAppSelector((state) => state.flowBuilder);

  const [initialSegmentSettings, setInitialSegmentSettings] =
    useState<SegmentsSettings>();
  const [initialJourneyEntrySettings, setInitialJourneyEntrySettings] =
    useState<JourneyEntrySettings>();
  const [initialJourneySettings, setInitialJourneySettings] =
    useState<JourneySettings>();

  const [
    flowViewerChangeSegmentModalOpened,
    setFlowViewerChangeSegmentModalOpened,
  ] = useState(false);
  const [
    flowViewerCancelConfirmationModalOpened,
    setFlowViewerCancelConfirmationModalOpened,
  ] = useState(false);

  useEffect(() => {
    if (locationState?.stepId && nodes.length > 0) {
      const searchedNode = nodes.find(
        (el) => el.data.stepId === locationState?.stepId
      );

      if (!searchedNode) return;
      dispatch(
        setNodes(
          nodes.map((node) => ({
            ...node,
            selected: node.data.stepId === locationState.stepId ? true : false,
          }))
        )
      );
      locationState.stepId = null;
    }
  }, [nodes]);

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
              (node.type !== NodeType.MESSAGE && node.type !== NodeType.TRACKER)
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
      dispatch(setFlowId(id));

      let status: JourneyStatus = JourneyStatus.DRAFT;

      if (data.isActive) status = JourneyStatus.ACTIVE;
      if (data.isPaused) status = JourneyStatus.PAUSED;
      if (data.isStopped) status = JourneyStatus.STOPPED;
      if (data.isDeleted) status = JourneyStatus.DELETED;

      dispatch(setFlowStatus(status));
    } finally {
      setIsLoading(false);
      dispatch(setIsViewMode(true));
    }
  };

  const onSave = async (changeSegmentOption?: ChangeSegmentOption) => {
    if (
      JSON.stringify(segmentsSettings) !==
        JSON.stringify(initialSegmentSettings) &&
      !changeSegmentOption
    ) {
      setFlowViewerChangeSegmentModalOpened(true);
      return;
    }

    setFlowViewerChangeSegmentModalOpened(false);
    setFlowViewerCancelConfirmationModalOpened(false);
    setOnConfirmNextTab(undefined);

    await ApiService.patch({
      url: "/journeys",
      options: {
        id,
        inclusionCriteria: segmentsSettings,
        changeSegmentOption,
        journeyEntrySettings: journeyEntrySettings,
        journeySettings: journeySettings,
      },
    });

    await loadJourney();
  };

  const onCancel = async (confirmed = false) => {
    if (
      !confirmed &&
      (JSON.stringify(initialSegmentSettings) !==
        JSON.stringify(segmentsSettings) ||
        JSON.stringify(initialJourneyEntrySettings) !==
          JSON.stringify(journeyEntrySettings) ||
        JSON.stringify(initialJourneySettings) !==
          JSON.stringify(journeySettings))
    ) {
      setFlowViewerCancelConfirmationModalOpened(true);
      return;
    }

    setFlowViewerCancelConfirmationModalOpened(false);
    if (onConfirmNextTab) {
      setCurrentTab(onConfirmNextTab);
      setOnConfirmNextTab(undefined);
    }
    await loadJourney();
  };

  const tabs: Record<FlowViewerTab, ReactNode> = {
    [FlowViewerTab.JOURNEY]: (
      <div className="w-full h-full flex">
        <FlowEditor isViewMode={true} className="bg-[#F9FAFB]" />
        <FlowViewerSidePanel />
      </div>
    ),
    [FlowViewerTab.ENTRY]:
      flowStatus === JourneyStatus.STOPPED ||
      flowStatus === JourneyStatus.DELETED ? (
        <JourneyEntrySettingsViewer
          journeyEntrySettings={journeyEntrySettings}
          segmentsSettings={segmentsSettings}
        />
      ) : (
        <>
          <FlowBuilderSegmentEditor
            onSave={() => onSave()}
            onCancel={() => onCancel()}
          />
          <FlowViewerChangeSegmentModal
            isOpen={flowViewerChangeSegmentModalOpened}
            onClose={() => setFlowViewerChangeSegmentModalOpened(false)}
            onSave={onSave}
          />
        </>
      ),
    [FlowViewerTab.SETTINGS]:
      flowStatus === JourneyStatus.STOPPED ||
      flowStatus === JourneyStatus.DELETED ? (
        <JourneySettingsViewer journeySettings={journeySettings} />
      ) : (
        <FlowBuilderSettings
          onSave={() => onSave()}
          onCancel={() => onCancel()}
        />
      ),
    [FlowViewerTab.ACTIVITY_HISTORY]: <ActivityHistoryViewer id={id} />,
  };

  useEffect(() => {
    loadJourney();
  }, [currentTab]);

  const handleChangeCurrentTab = (newTab: FlowViewerTab) => {
    if (
      JSON.stringify(initialSegmentSettings) !==
        JSON.stringify(segmentsSettings) ||
      JSON.stringify(initialJourneyEntrySettings) !==
        JSON.stringify(journeyEntrySettings) ||
      JSON.stringify(initialJourneySettings) !== JSON.stringify(journeySettings)
    ) {
      setOnConfirmNextTab(newTab);
      onCancel();
      return;
    }

    setCurrentTab(newTab);
  };

  return (
    <div className="relative w-full h-full text-[#111827] font-inter font-normal text-[14px] leading-[22px]">
      {isLoading && (
        <div className="w-full h-full absolute top-0 left-0 bg-[#111827] bg-opacity-20 z-[99]">
          <Progress />
        </div>
      )}
      <FlowViewerHeader
        tabs={tabs}
        currentTab={currentTab}
        setCurrentTab={handleChangeCurrentTab}
      />
      <div className="relative flex w-full h-full max-h-[calc(100%-140px)]">
        {tabs[currentTab]}
      </div>
      <FlowViewerCancelConfirmationModal
        isOpen={flowViewerCancelConfirmationModalOpened}
        onDiscard={() => onCancel(true)}
        onSave={() => onSave()}
      />
    </div>
  );
};

export default FlowViewerv2;
