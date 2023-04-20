import React, { FC } from "react";
import { SizeUnit } from "./types";

interface SizeUnitPickerProps {
  value: SizeUnit;
  onChange: (unit: SizeUnit) => void;
}

const SizeUnitPicker: FC<SizeUnitPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center text-[#BAC3C0] gap-[5px] select-none min-w-[42px]">
      <span
        onClick={() => onChange(SizeUnit.PIXEL)}
        className={`cursor-pointer hover:text-white ${
          value === SizeUnit.PIXEL ? "text-white" : ""
        }`}
      >
        PX
      </span>
      <span>|</span>
      <span
        onClick={() => onChange(SizeUnit.PERCENTAGE)}
        className={`cursor-pointer hover:text-white ${
          value === SizeUnit.PERCENTAGE ? "text-white" : ""
        }`}
      >
        %
      </span>
    </div>
  );
};

export default SizeUnitPicker;
