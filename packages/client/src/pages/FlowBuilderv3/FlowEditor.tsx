import React from "react";

const FlowEditor = () => {
  return (
    <div className="relative w-full h-full bg-[#F3F4F6] text-[#111827]">
      <div className="absolute top-[17px] left-[6px] w-[95px] h-[30px]">
        <select
          className="w-full h-full border-[1px] border-[#E5E7EB] p-[8px] font-medium text-[12px] leading-[14px] rounded-[4px]"
          value="100%"
        >
          <option value="100%">100%</option>
        </select>
      </div>
    </div>
  );
};

export default FlowEditor;
