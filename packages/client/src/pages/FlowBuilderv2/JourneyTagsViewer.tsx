import React, { FC } from "react";

interface JourneyTagsViewerProps {
  tags: string[];
}

const JourneyTagsViewer: FC<JourneyTagsViewerProps> = ({ tags }) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Journey tags
      </div>
      <div className="flex gap-2.5">
        {tags.map((tag, i) => (
          <div
            key={i}
            className="py-[2px] pl-[8px] pr-[4px] font-roboto text-[12px] leading-[20px] bg-[#E5E7EB] border border-[#E5E7EB] rounded-sm"
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JourneyTagsViewer;
