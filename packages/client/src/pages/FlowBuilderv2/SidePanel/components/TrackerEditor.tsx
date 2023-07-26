import Select from "components/Elements/Selectv2";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { TrackerNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { Node } from "reactflow";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Template from "types/Template";

interface TrackerEditorProps {
  trackerId?: string;
  event?: string;
  onTrackerChange: (trackerId: string) => void;
  onEventChange: (event: string) => void;
}

const TrackerEditor: FC<TrackerEditorProps> = ({
  trackerId,
  event,
  onTrackerChange,
  onEventChange,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

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
      url: "/templates/" + chosenTracker.trackerTemplate.name,
    });

    setPossibleEvents(template.customEvents);
  };

  useEffect(() => {
    loadPossibleEvents();
  }, [chosenTracker]);

  const filledTrackerNodes = nodes.filter(
    (node) => node.data.type === NodeType.TRACKER && node.data.tracker
  ) as Node<TrackerNodeData>[];

  const possibleTrackers = filledTrackerNodes.map(
    (node) => node.data.tracker?.trackerId
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
    </>
  );
};

export default TrackerEditor;
