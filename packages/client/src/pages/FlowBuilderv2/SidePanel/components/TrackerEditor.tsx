import Select from "components/Elements/Selectv2";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { TrackerNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { Node } from "reactflow";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Template from "types/Template";
import getDistinct from "utils/getDistinct";
import getNodesFromTreeAbove from "utils/getNodesFromTreeAbove";
import { ConditionEditorError, errorToMessageMap } from "./ConditionEditor";

interface TrackerEditorProps {
  trackerId?: string;
  event?: string;
  errors?: {
    [ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED]: string;
    [ConditionEditorError.NO_TRACKER_SPECIFiED]: string;
  };
  showErrors?: boolean;
  onTrackerChange: (trackerId: string) => void;
  onEventChange: (event: string) => void;
}

const TrackerEditor: FC<TrackerEditorProps> = ({
  trackerId,
  event,
  errors,
  showErrors,
  onTrackerChange,
  onEventChange,
}) => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);

  const [possibleEvents, setPossibleEvents] = useState<string[]>([]);

  const chosenTracker = (
    nodes.find(
      (node) =>
        node.data.type === NodeType.TRACKER &&
        node.data.tracker &&
        node.data.tracker.trackerId === trackerId
    )?.data as TrackerNodeData
  )?.tracker;

  const loadPossibleEvents = async () => {
    if (!chosenTracker) return;
    const { data: template } = await ApiService.get<Template>({
      url: "/templates/" + chosenTracker.trackerTemplate.id,
    });

    setPossibleEvents(template.customEvents);
  };

  useEffect(() => {
    loadPossibleEvents();
  }, [chosenTracker]);

  const selectedNode = nodes.find((node) => node.selected);

  const filledTrackerNodes = (
    selectedNode
      ? getNodesFromTreeAbove(selectedNode, nodes, edges).filter(
          (node) => node.data.type === NodeType.TRACKER && node.data.tracker
        )
      : []
  ) as Node<TrackerNodeData>[];

  const possibleTrackers = getDistinct(
    filledTrackerNodes.map((node) => node.data.tracker?.trackerId),
    (item) => item
  );

  return (
    <>
      <Select
        options={possibleTrackers.map((possibleTracker) => ({
          key: possibleTracker || "",
          title: possibleTracker || "",
        }))}
        value={trackerId || ""}
        onChange={onTrackerChange}
        placeholder="Tracker id"
        noDataPlaceholder="No trackers in this journey"
      />
      {showErrors &&
        errors &&
        errors[ConditionEditorError.NO_TRACKER_SPECIFiED] && (
          <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
            {errorToMessageMap[ConditionEditorError.NO_TRACKER_SPECIFiED]}
          </div>
        )}

      <Select
        options={possibleEvents.map((possibleEvent) => ({
          key: possibleEvent,
          title: possibleEvent,
        }))}
        value={event || ""}
        onChange={onEventChange}
        placeholder="Event name"
        noDataPlaceholder="No events"
      />
      {showErrors &&
        errors &&
        errors[ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED] && (
          <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
            {errorToMessageMap[ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED]}
          </div>
        )}
    </>
  );
};

export default TrackerEditor;
