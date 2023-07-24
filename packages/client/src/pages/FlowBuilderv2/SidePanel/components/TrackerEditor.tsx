import Select from "components/Elements/Selectv2";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { TrackerNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { Node } from "reactflow";
import { useAppSelector } from "store/hooks";

interface TrackerEditorProps {
  tracker?: {
    id: string;
    name: string;
  };
  event?: string;
  onTrackerChange: (tracker: { id: string; name: string }) => void;
  onEventChange: (event: string) => void;
}

const TrackerEditor: FC<TrackerEditorProps> = ({
  tracker,
  event,
  onTrackerChange,
  onEventChange,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

  const filledTrackerNodes = nodes.filter(
    (node) => node.data.type === NodeType.TRACKER && node.data.tracker
  ) as Node<TrackerNodeData>[];

  const possibleTrackers = filledTrackerNodes.map(
    (node) => node.data.tracker?.trackerTemplate
  );

  return (
    <>
      <Select
        options={possibleTrackers.map((possibleTracker) => ({
          key: tracker || { id: "", name: "" },
          title: `${possibleTracker?.name} / ${possibleTracker?.id}`,
        }))}
        value={tracker || { id: "", name: "" }}
        onChange={onTrackerChange}
        placeholder="Tracker name / ID"
        noDataPlaceholder="No trackers in this journey"
      />

      <Select
        options={[]}
        value={event || ""}
        onChange={onEventChange}
        placeholder="Event name"
        noDataPlaceholder="No events"
      />
    </>
  );
};

export default TrackerEditor;
