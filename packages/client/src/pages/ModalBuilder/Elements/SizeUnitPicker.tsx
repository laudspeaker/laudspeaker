import React, { FC } from "react";
import { SizeUnit } from "../types";

interface SizeUnitPickerProps {
  value: SizeUnit;
  onChange: (unit: SizeUnit) => void;
}

const SizeUnitPicker: FC<SizeUnitPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center text-[#9CA3AF] gap-[5px] select-none w-[50px]">
      <span
        onClick={() => onChange(SizeUnit.PIXEL)}
        className={`cursor-pointer hover:text-[#111827] ${
          value === SizeUnit.PIXEL ? "text-[#111827]" : ""
        }`}
      >
        PX
      </span>
      <span>|</span>
      <span
        onClick={() => onChange(SizeUnit.PERCENTAGE)}
        className={`cursor-pointer hover:text-[#111827] ${
          value === SizeUnit.PERCENTAGE ? "text-[#111827]" : ""
        }`}
      >
        %
      </span>
    </div>
  );
};

export default SizeUnitPicker;
