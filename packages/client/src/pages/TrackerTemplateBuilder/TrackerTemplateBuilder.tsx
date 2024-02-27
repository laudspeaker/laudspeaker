import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useHover } from "react-use";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import Template from "types/Template";
import TrackerTemplateEditor from "./components/TrackerTemplateEditor";
import TrackerTemplateViewer from "./components/TrackerTemplateViewer";

export interface TrackerField {
  name: string;
  type: StatementValueType;
  defaultValue: string;
}

export interface TrackerData {
  name: string;
  fields: TrackerField[];
  events: string[];
}

const TrackerTemplateBuilder = () => {
  const { id } = useParams();

  const [isFirstRender, setIsFirstRender] = useState(true);
  const [trackerData, setTrackerData] = useState<TrackerData>({
    name: "",
    fields: [],
    events: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUsed, setIsUsed] = useState(false);
  const [isEditHovered, setIsEditHovered] = useState(false);

  const loadData = async () => {
    const { data } = await ApiService.get<Template>({
      url: "/templates/" + id,
    });

    setTrackerData({
      name: data.name,
      fields: (data.customFields?.fields || []) as TrackerField[],
      events: data.customEvents,
    });
  };

  useLayoutEffect(() => {
    loadData();
  }, []);

  const saveData = async () => {
    await ApiService.patch({
      url: "/templates/" + id,
      options: {
        name: trackerData.name,
        type: "custom_component",
        customEvents: trackerData.events,
        customFields: { fields: trackerData.fields },
      },
    });
  };

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    saveData();
  }, [trackerData]);

  const handleDeleteTrackerTemplate = async () => {};

  return (
    <div className="font-inter text-[14px] font-normal leading-[22px] text-[#111827] flex flex-col gap-5">
      <div className="px-[40px] py-[34px] bg-white border-b-[1px] border-b-[#E5E7EB] flex justify-between items-center">
        <div className="text-[20px] font-semibold leading-[28px] flex gap-[10px] items-center">
          {!isEditing && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40ZM13.25 10.75C12.388 10.75 11.5614 11.0924 10.9519 11.7019C10.3424 12.3114 10 13.138 10 14V26C10 26.862 10.3424 27.6886 10.9519 28.2981C11.5614 28.9076 12.388 29.25 13.25 29.25H26.75C27.612 29.25 28.4386 28.9076 29.0481 28.2981C29.6576 27.6886 30 26.862 30 26V14C30 13.138 29.6576 12.3114 29.0481 11.7019C28.4386 11.0924 27.612 10.75 26.75 10.75H13.25ZM12.3661 13.1161C12.6005 12.8817 12.9185 12.75 13.25 12.75H26.75C27.0815 12.75 27.3995 12.8817 27.6339 13.1161C27.8683 13.3505 28 13.6685 28 14H12C12 13.6685 12.1317 13.3505 12.3661 13.1161ZM12 26V16H28V26C28 26.3315 27.8683 26.6495 27.6339 26.8839C27.3995 27.1183 27.0815 27.25 26.75 27.25H13.25C12.9185 27.25 12.6005 27.1183 12.3661 26.8839C12.1317 26.6495 12 26.3315 12 26ZM14.25 17C13.6977 17 13.25 17.4477 13.25 18C13.25 18.5523 13.6977 19 14.25 19H20.5C21.0523 19 21.5 18.5523 21.5 18C21.5 17.4477 21.0523 17 20.5 17H14.25ZM14.25 20.5C13.6977 20.5 13.25 20.9477 13.25 21.5C13.25 22.0523 13.6977 22.5 14.25 22.5H26C26.5523 22.5 27 22.0523 27 21.5C27 20.9477 26.5523 20.5 26 20.5H14.25Z"
                fill="#4B5563"
              />
            </svg>
          )}
          <div>{isEditing ? "Component template" : trackerData.name}</div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-[10px]">
            <div
              className="relative"
              onMouseEnter={() => setIsEditHovered(true)}
              onMouseLeave={() => setIsEditHovered(false)}
            >
              <Button
                type={ButtonType.SECONDARY}
                onClick={() => setIsEditing(true)}
                disabled={isUsed}
              >
                Edit
              </Button>

              {isUsed && isEditHovered && (
                <div className="min-w-[280px] absolute -bottom-[70px] left-1/2 -translate-x-1/2 p-[10px] bg-[#111827] text-white">
                  This template is currently in use and cannot be edited
                </div>
              )}
            </div>

            <Button
              type={ButtonType.DANGEROUS}
              onClick={handleDeleteTrackerTemplate}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="p-5">
        {isEditing ? (
          <TrackerTemplateEditor
            trackerData={trackerData}
            setTrackerData={setTrackerData}
            setIsEditing={setIsEditing}
          />
        ) : (
          <TrackerTemplateViewer trackerData={trackerData} />
        )}
      </div>
    </div>
  );
};

export default TrackerTemplateBuilder;
