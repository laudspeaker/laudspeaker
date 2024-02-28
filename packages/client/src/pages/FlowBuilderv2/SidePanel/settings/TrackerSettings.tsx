import Select from "components/Elements/Selectv2";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import {
  TrackerNodeData,
  TrackerVisibility,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { TrackerField } from "pages/TrackerTemplateBuilder/TrackerTemplateBuilder";
import React, { FC, useEffect, useState } from "react";
import { Node } from "reactflow";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Template from "types/Template";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import generateName from "@good-ghosting/random-name-generator";
import deepCopy from "utils/deepCopy";
import getDistinct from "utils/getDistinct";
import getNodesFromTreeAbove from "utils/getNodesFromTreeAbove";

const TrackerSettings: FC<SidePanelComponentProps<TrackerNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);

  const [trackerTemplates, setTrackerTemplates] = useState<
    { id: number; name: string; fields: TrackerField[] }[]
  >([]);

  const loadTrackerTemplates = async () => {
    const {
      data: { data },
    } = await ApiService.get<{ data: Template[]; totalPages: number }>({
      url: `/templates?type=custom_component`,
    });

    setTrackerTemplates(
      data.map((template) => ({
        id: template.id,
        name: template.name,
        fields: (template.customFields?.fields || []) as TrackerField[],
      }))
    );
  };

  useEffect(() => {
    loadTrackerTemplates();
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

  const selectedNode = nodes.find((node) => node.selected);

  const filledTrackerNodes = selectedNode
    ? (getNodesFromTreeAbove(selectedNode, nodes, edges).filter(
        (node) => node.data.type === NodeType.TRACKER && node.data.tracker
      ) as Node<TrackerNodeData>[])
    : [];

  return (
    <div className="font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      {nodeData.tracker ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-[10px]">
            <div className="flex justify-between items-center">
              <div>Tracker ID</div>
              <div className="relative w-[200px] font-roboto bg-[#F3F4F6] px-[12px] py-[5px] rounded-sm border border-[#E5E7EB]">
                <div>{nodeData.tracker.trackerId}</div>

                <button
                  className="absolute right-[12px] top-1/2 -translate-y-1/2"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      nodeData.tracker?.trackerId || ""
                    )
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M11.8125 12.9375V15.4688C11.8125 15.9345 11.4345 16.3125 10.9688 16.3125H3.65625C3.43247 16.3125 3.21786 16.2236 3.05963 16.0654C2.90139 15.9071 2.8125 15.6925 2.8125 15.4688V5.90625C2.8125 5.4405 3.1905 5.0625 3.65625 5.0625H5.0625C5.43943 5.06224 5.81573 5.09335 6.1875 5.1555M11.8125 12.9375H14.3438C14.8095 12.9375 15.1875 12.5595 15.1875 12.0938V8.4375C15.1875 5.0925 12.7552 2.31675 9.5625 1.7805C9.19073 1.71835 8.81443 1.68725 8.4375 1.6875H7.03125C6.5655 1.6875 6.1875 2.0655 6.1875 2.53125V5.1555M11.8125 12.9375H7.03125C6.80747 12.9375 6.59286 12.8486 6.43463 12.6904C6.27639 12.5321 6.1875 12.3175 6.1875 12.0938V5.1555M15.1875 10.125V8.71875C15.1875 8.04742 14.9208 7.40359 14.4461 6.92889C13.9714 6.45419 13.3276 6.1875 12.6562 6.1875H11.5312C11.3075 6.1875 11.0929 6.09861 10.9346 5.94037C10.7764 5.78214 10.6875 5.56753 10.6875 5.34375V4.21875C10.6875 3.88634 10.622 3.55719 10.4948 3.25008C10.3676 2.94298 10.1812 2.66394 9.94611 2.42889C9.71107 2.19384 9.43202 2.00739 9.12492 1.88018C8.81781 1.75297 8.48866 1.6875 8.15625 1.6875H7.3125"
                      stroke="#4B5563"
                      strokeWidth="1.125"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>Component template</div>
              <div className="w-[200px]">
                <Select
                  panelClassName="max-w-[200px]"
                  options={trackerTemplates.map((template) => ({
                    key: template,
                    title: `${template.id} / ${template.name}`,
                  }))}
                  value={trackerTemplates.find(
                    (trackerTemplate) =>
                      nodeData.tracker?.trackerTemplate.id ===
                      trackerTemplate.id
                  )}
                  onChange={(template) => {
                    if (!template) return;
                    setNodeData({
                      ...nodeData,
                      tracker: {
                        trackerId:
                          nodeData.tracker?.trackerId ||
                          generateName({ number: true }).dashed,
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
                    });
                  }}
                  placeholder="select component template"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>Visibility</div>
              <div className="w-[200px] flex">
                <button
                  className={`w-full px-[6px] py-[5px] flex justify-center rounded-l-[2px] ${
                    nodeData.tracker.visibility === TrackerVisibility.SHOW
                      ? "bg-[#6366F1] text-white"
                      : "border border-[#E5E7EB]"
                  }`}
                  onClick={() => handleChangeVisibility(TrackerVisibility.SHOW)}
                >
                  Show
                </button>
                <button
                  className={`w-full px-[6px] py-[5px] flex justify-center rounded-r-[2px] ${
                    nodeData.tracker.visibility === TrackerVisibility.HIDE
                      ? "bg-[#6366F1] text-white"
                      : "border border-[#E5E7EB]"
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
                <div className="text-[12px] leading-5 text-[#4B5563]">
                  Description Description Description Des
                </div>
                {nodeData.tracker.fields.map((field, i) => (
                  <div
                    key={i}
                    className="p-[10px] bg-[#F3F4F6] border border-[#E5E7EB] rounded flex flex-col gap-[5px]"
                  >
                    <div className="flex gap-[5px]">
                      <div className="font-semibold">{field.name}</div>
                      <div className="text-[#4B5563]">({field.type})</div>
                    </div>
                    <div className="bg-white rounded-sm">
                      <DynamicInput
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
          <div className="font-semibold">
            Create a custom component from component templates
          </div>

          <Select
            options={trackerTemplates.map((template) => ({
              key: template,
              title: `${template.id} / ${template.name}`,
            }))}
            value={trackerTemplates.find(
              (trackerTemplate) =>
                trackerTemplate.id === nodeData.tracker?.trackerTemplate.id
            )}
            onChange={(template) => {
              if (!template) return;
              setNodeData({
                ...nodeData,
                tracker: {
                  trackerId: generateName({ number: true }).dashed,
                  visibility: TrackerVisibility.SHOW,
                  fields: template.fields.map((field) => ({
                    name: field.name,
                    type: field.type,
                    value: field.defaultValue,
                  })),
                  trackerTemplate: { id: template.id, name: template.name },
                },
              });
            }}
            placeholder="select component template"
          />
          {filledTrackerNodes.length > 0 && (
            <>
              <div className="w-fit px-[12px] py-[5px] bg-[#F3F4F6] rounded-sm border-[#E5E7EB] border">
                OR
              </div>

              <div className="font-semibold">
                Select an existing tracker in the journey
              </div>

              {getDistinct(
                filledTrackerNodes,
                (item) => item.data.tracker?.trackerId
              ).map((trackerNode, i) => (
                <React.Fragment key={i}>
                  {trackerNode.data.tracker !== undefined && (
                    <button
                      onClick={() =>
                        trackerNode.data.tracker &&
                        setNodeData({
                          ...nodeData,
                          tracker: { ...deepCopy(trackerNode.data.tracker) },
                        })
                      }
                      className="w-full p-[10px] rounded border border-[#E5E7EB] flex justify-between items-center hover:bg-[#EEF2FF]"
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
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackerSettings;
