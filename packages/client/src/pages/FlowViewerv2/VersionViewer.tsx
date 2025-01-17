import React, { useState, useEffect } from "react";
import FlowEditor, { NodeType } from "pages/FlowBuilderv2/FlowEditor";
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
  setJourneyType,
} from "reducers/flow-builder.reducer";
import { useParams } from "react-router-dom";
import Progress from "components/Progress";
import { EdgeData } from "pages/FlowBuilderv2/Edges/EdgeData";
import { NodeData, Stats } from "pages/FlowBuilderv2/Nodes/NodeData";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import { Edge, Node } from "reactflow";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import useVersions from "hooks/useVersions";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { TickIcon } from "pages/FlowBuilderv2/Icons";
import Select from "components/Elements/Selectv2";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import RestoreVersionModal from "pages/FlowBuilderv2/Modals/RestoreVersionModal";

const nodesToLoadCustomerCount: NodeType[] = [
  NodeType.WAIT_UNTIL,
  NodeType.TIME_DELAY,
  NodeType.TIME_WINDOW,
];

const VersionViewer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const { id } = useParams();
  const versions = useVersions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { flowId, flowName, isStarting } = useAppSelector(
    (state) => state.flowBuilder
  );

  useEffect(() => {
    const currentVersion = versions.find((version) => `${version.uuid}` === id);

    if (currentVersion && !selectedVersion.length) {
      setSelectedVersion(currentVersion?.name);
    }
  }, [id]);

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

      dispatch(
        setJourneyType(
          data.isDynamic ? JourneyType.DYNAMIC : JourneyType.STATIC
        )
      );

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

  const handleExit = () => {
    navigate("/flow");
  };

  const versionsOptions = versions.map((version) => {
    return {
      key: version.name,
      title: version.name,
      additionalData: format(new Date(version.created_at), "dd MMM, hh:mm a"),
    };
  });

  const renderCustomOption = (
    props: any,
    additionalData: string | undefined
  ) => {
    const title = props["data-option"];
    return (
      <div
        {...props}
        className="flex flex-row items-center px-[20px] py-[10px] min-w-[200px] justify-between"
      >
        <div>
          {title}
          {!!additionalData && (
            <div className="text-[12px] text-[#4B5563]">{additionalData}</div>
          )}
        </div>
        {selectedVersion === title && <TickIcon />}
      </div>
    );
  };

  useEffect(() => {
    loadJourney();
  }, [id]);

  return (
    <>
      {isLoading && (
        <div className="w-full h-full absolute top-0 left-0 bg-[#111827] bg-opacity-20 z-[99]">
          <Progress />
        </div>
      )}
      <div className="w-full flex justify-between items-center h-[60px] border-y-[1px] border-[#E5E7EB] bg-white font-segoe font-normal text-[16px] text-[#111827] leading-[24px]">
        <div className="flex items-center ml-[16px]">
          <div className="text-ellipsis max-w-[260px] overflow-hidden mr-[16px] font-inter font-normal text-[14px] leading-[22px]">
            {flowName}
          </div>

          <RestoreVersionModal
            isOpen={isRestoreModalOpen}
            onClose={() => setIsRestoreModalOpen(false)}
            versionName={selectedVersion}
            onConfirm={() => {
              const draftVersionId = versions.find(
                (version) => version.name === "Draft"
              )?.uuid;
              if (draftVersionId) {
                navigate(`/flow/${draftVersionId}`, {
                  state: { isFromVersions: true },
                });
              }
            }}
          />
        </div>

        <div className="justify-center">
          <Select
            className="border-transparent"
            options={versionsOptions}
            value={selectedVersion}
            onChange={(value) => {
              const newVersion = versions.find(
                (version) => version.name === value
              );
              const newVersionId = newVersion?.uuid;
              setSelectedVersion(value);

              if (newVersion?.name === "Draft") {
                navigate(`/flow/${newVersionId}`, {
                  state: { isFromVersions: true },
                });
              } else if (newVersionId) {
                navigate(`/flow/${newVersionId}/review-version`);
              }
            }}
            renderCustomOption={renderCustomOption}
          />
        </div>

        <div className="flex">
          <Button
            type={ButtonType.SECONDARY_GREY}
            onClick={handleExit}
            className="mr-[10px]"
            id="exit-button"
          >
            Exit
          </Button>

          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              setIsRestoreModalOpen(true);
            }}
            className="mr-[20px]"
            id="start-journey-button"
            disabled={isStarting}
          >
            Restore
          </Button>
        </div>
      </div>

      <div className="relative w-full h-full text-[#111827] font-inter font-normal text-[14px] leading-[22px]">
        <FlowEditor isViewMode className="bg-[#F9FAFB]" />
      </div>
    </>
  );
};

export default VersionViewer;
