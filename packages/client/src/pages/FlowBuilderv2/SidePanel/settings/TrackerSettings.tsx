import Select from "components/Elements/Selectv2";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import {
  TrackerNodeData,
  TrackerVisibility,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { TrackerField } from "pages/TrackerTemplateBuilder/TrackerTemplateBuilder";
import { FC, useEffect, useState } from "react";
import { Node } from "reactflow";
import { StatementValueType } from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";

const TrackerSettings: FC<SidePanelComponentProps<TrackerNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

  const [trackerTemplates, setTrackerTemplates] = useState<
    { id: string; name: string; fields: TrackerField[] }[]
  >([
    {
      id: "whale",
      name: "whalename",
      fields: [
        { name: "1", type: StatementValueType.BOOLEAN, defaultValue: "true" },
      ],
    },
  ]);

  useEffect(() => {
    setNodeData({ ...nodeData, needsCheck: false });
  }, []);

  const handleChangeField = (i: number, value: string) => {
    if (!nodeData.tracker) return;

    const newTrackerFields = [...nodeData.tracker.fields];
    newTrackerFields[i].value = value;

    setNodeData({
      ...nodeData,
      tracker: { ...nodeData.tracker, fields: newTrackerFields },
    });
  };

  const handleChangeVisibility = (value: TrackerVisibility) => {
    if (!nodeData.tracker) return;

    setNodeData({
      ...nodeData,
      tracker: {
        ...nodeData.tracker,
        visibility: value,
      },
    });
  };

  const filledTrackerNodes = nodes.filter(
    (node) => node.data.type === NodeType.TRACKER && node.data.tracker
  ) as Node<TrackerNodeData>[];

  return (
    <div className="font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      {nodeData.tracker ? (
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[10px]">
            <div className="flex justify-between items-center">
              <div>Modal ID</div>
              <div className="w-[200px] font-roboto bg-[#F3F4F6] px-[12px] py-[5px] rounded-[2px] border-[1px] border-[#E5E7EB]">
                exampleId
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>Modal template</div>
              <div className="w-[200px]">
                <Select
                  options={trackerTemplates.map((template) => ({
                    key: template,
                    title: `${template.id} / ${template.name}`,
                  }))}
                  value={trackerTemplates[0]}
                  onChange={(template) =>
                    setNodeData({
                      ...nodeData,
                      tracker: {
                        trackerId: template.id,
                        visibility: TrackerVisibility.SHOW,
                        fields: template.fields.map((field) => ({
                          name: field.name,
                          type: field.type,
                          value: field.defaultValue,
                        })),
                        trackerTemplate: {
                          id: template.id,
                          name: template.name,
                        },
                      },
                    })
                  }
                  placeholder="select tracker template"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>Modal ID</div>
              <div className="w-[200px] flex">
                <button
                  className={`w-full px-[6px] py-[5px] flex justify-center rounded-l-[2px] ${
                    nodeData.tracker.visibility === TrackerVisibility.SHOW
                      ? "bg-[#6366F1] text-white"
                      : "border-[1px] border-[#E5E7EB]"
                  }`}
                  onClick={() => handleChangeVisibility(TrackerVisibility.SHOW)}
                >
                  Show
                </button>
                <button
                  className={`w-full px-[6px] py-[5px] flex justify-center rounded-r-[2px] ${
                    nodeData.tracker.visibility === TrackerVisibility.HIDE
                      ? "bg-[#6366F1] text-white"
                      : "border-[1px] border-[#E5E7EB]"
                  }`}
                  onClick={() => handleChangeVisibility(TrackerVisibility.HIDE)}
                >
                  Hide
                </button>
              </div>
            </div>
          </div>

          {nodeData.tracker.fields.length > 0 && (
            <>
              <div className="h-[1px] w-full bg-[#E5E7EB]" />

              <div className="flex flex-col gap-[10px]">
                <div className="font-semibold">Field value</div>
                <div className="text-[12px] leading-[20px] text-[#4B5563]">
                  Description Description Description Des
                </div>
                {nodeData.tracker.fields.map((field, i) => (
                  <div
                    key={i}
                    className="p-[10px] bg-[#F3F4F6] border-[1px] border-[#E5E7EB] rounded-[4px] flex flex-col gap-[5px]"
                  >
                    <div className="flex gap-[5px]">
                      <div className="font-semibold">{field.name}</div>
                      <div className="text-[#4B5563]">({field.type})</div>
                    </div>
                    <div className="bg-white rounded-[2px]">
                      <FlowBuilderDynamicInput
                        type={field.type}
                        value={field.value}
                        onChange={(value) => handleChangeField(i, value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <div>Create a modal from modal templates</div>

          <Select
            options={trackerTemplates.map((template) => ({
              key: template,
              title: `${template.id} / ${template.name}`,
            }))}
            value={trackerTemplates[0]}
            onChange={(template) =>
              setNodeData({
                ...nodeData,
                tracker: {
                  trackerId: template.id,
                  visibility: TrackerVisibility.SHOW,
                  fields: template.fields.map((field) => ({
                    name: field.name,
                    type: field.type,
                    value: field.defaultValue,
                  })),
                  trackerTemplate: { id: template.id, name: template.name },
                },
              })
            }
            placeholder="select tracker template"
          />

          <div className="px-[12px] py-[5px] bg-[#F3F4F6] rounded-[2px] border-[#E5E7EB] border-[1px]">
            OR
          </div>

          <div>Select an existing modal in the journey</div>

          {filledTrackerNodes.map((trackerNode, i) => (
            <>
              {trackerNode.data.tracker !== undefined && (
                <button
                  key={i}
                  onClick={() => {}}
                  className="w-full p-[10px] rounded-[4px] border-[1px] border-[#E5E7EB] flex justify-between items-center hover:bg-[#EEF2FF]"
                >
                  <div>{trackerNode.data.tracker?.trackerId}</div>
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M5.49805 3L10.498 8L5.49805 13"
                        stroke="#4B5563"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              )}
            </>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackerSettings;
