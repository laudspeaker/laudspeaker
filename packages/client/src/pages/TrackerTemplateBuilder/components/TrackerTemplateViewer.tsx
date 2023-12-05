import Table from "components/Tablev2";
import React, { FC } from "react";
import { TrackerData } from "../TrackerTemplateBuilder";

interface TrackerTemplateViewerProps {
  trackerData: TrackerData;
}

const TrackerTemplateViewer: FC<TrackerTemplateViewerProps> = ({
  trackerData,
}) => {
  return (
    <div className="p-5 bg-white rounded flex flex-col gap-5">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[16px] font-semibold leading-[24px]">Field</div>

        <div className="rounded border-t-[1px] border-x-[1px] border-[#E5E7EB]">
          <Table
            className="w-full"
            headings={[
              <div className="px-5 py-[10px] min-h-[22px]">Field name</div>,
              <div className="px-5 py-[10px] min-h-[22px]">Type</div>,
              <div className="px-5 py-[10px] min-h-[22px]">Value</div>,
            ]}
            rows={
              trackerData.fields.length === 0
                ? [
                    [
                      <div className="min-h-[22px] text-[#4B5563] max-w-[160px]">
                        No field
                      </div>,
                      <div className="min-h-[22px]"></div>,
                      <div className="min-h-[22px]"></div>,
                    ],
                  ]
                : trackerData.fields.map((field) => [
                    <div className="min-h-[22px]">{field.name}</div>,
                    <div className="min-h-[22px]">{field.type}</div>,
                    <div className="min-h-[22px]">{field.defaultValue}</div>,
                  ])
            }
          />
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#E5E7EB]" />

      <div className="flex flex-col gap-[10px]">
        <div className="text-[16px] font-semibold leading-[24px]">Event</div>

        <div className="rounded border-t-[1px] border-x-[1px] border-[#E5E7EB]">
          <Table
            className="w-full"
            rows={
              trackerData.events.length === 0
                ? [
                    [
                      <div className="px-1 py-[2px] min-h-[26px] text-[#4B5563]">
                        No event
                      </div>,
                    ],
                  ]
                : trackerData.events.map((event) => [
                    <div className="px-1 py-[2px] min-h-[26px]">{event}</div>,
                  ])
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TrackerTemplateViewer;
