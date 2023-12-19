import { PreviewImportResults } from "./PeopleImport";
import CloudArrowDownIcon from "@heroicons/react/24/outline/CloudArrowDownIcon";
import CheckBox from "components/Checkbox/Checkbox";
import { useState } from "react";
import Input from "components/Elements/Inputv2";

export interface ImportCompletionSegmentProps {
  withSegment: boolean;
  name: string;
  description: string;
}

interface ImportCompletionProps {
  preview?: PreviewImportResults;
  segment: ImportCompletionSegmentProps;
  setSegment: (val: ImportCompletionSegmentProps) => void;
}

const ImportCompletion = ({
  preview,
  segment,
  setSegment,
}: ImportCompletionProps) => {
  return (
    <div className="w-full flex justify-center">
      <div className="py-10 max-w-[800px] w-full">
        <div className="text-[#111827] text-base font-inter font-semibold mb-[10px]">
          From your file, we can
        </div>
        <div className="flex w-full mb-[10px] gap-[10px]">
          <div className="px-[10px] py-1 rounded border border-[#E5E7EB] w-full">
            <div className="text-[#6B7280] text-sm font-roboto">Create</div>
            <div className="mt-[10px] text-2xl text-[#111827] font-roboto">
              {preview?.created}
            </div>
          </div>
          <div className="px-[10px] py-1 rounded border border-[#E5E7EB] w-full">
            <div className="text-[#6B7280] text-sm font-roboto">Update</div>
            <div className="mt-[10px] text-2xl text-[#111827] font-roboto">
              {preview?.updated}
            </div>
          </div>
          <div className="relative px-[10px] py-1 rounded border border-[#E5E7EB] w-full">
            <div className="text-[#6B7280] text-sm font-roboto">Skip</div>
            <div className="mt-[10px] text-2xl text-[#111827] font-roboto">
              {preview?.skipped}
            </div>
            {preview?.url && (
              <a href={preview.url} target="_blank">
                <CloudArrowDownIcon className="transition-all absolute top-1/2 right-4 p-1 cursor-pointer -translate-y-1/2 w-10 h-10 text-[#111827] hover:text-[#6366F1]" />
              </a>
            )}
          </div>
        </div>
        <CheckBox
          onCheck={() => {}}
          text={
            <span className="text-[#6B7280] text-xs font-inter">
              agreement agreement agreement agreement agreement agreement
              agreement
            </span>
          }
        />
        <hr className="border-[#E5E7EB] my-5" />
        <div className="text-[#111827] text-base font-inter font-semibold mb-[10px]">
          Segment creation
        </div>
        <CheckBox
          onCheck={(checked) =>
            setSegment({ ...segment, withSegment: checked })
          }
          propControl
          initValue={segment.withSegment}
          text={
            <span className="text-[#6B7280] text-xs font-inter">
              Create a Segment from this Import
            </span>
          }
        />
        {segment.withSegment && (
          <>
            <div className="mt-[10px]">
              <div className="mb-[5px] text-sm text-[#111827] font-inter">
                Segment name
              </div>
              <Input
                value={segment.name}
                onChange={(val) => {
                  setSegment({ ...segment, name: val });
                }}
                placeholder={"Segment name"}
                wrapperClassName="!max-w-full w-full"
                className="w-full"
              />
            </div>
            <div className="mt-[10px]">
              <div className="mb-[5px] text-sm text-[#111827] font-inter">
                Description (optional)
              </div>
              <textarea
                value={segment.description}
                className="resize-none w-full border border-[#E5E7EB] rounded px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none"
                placeholder="Segment description"
                rows={3}
                onChange={(ev) => {
                  setSegment({
                    ...segment,
                    description: ev.target.value || "",
                  });
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportCompletion;
