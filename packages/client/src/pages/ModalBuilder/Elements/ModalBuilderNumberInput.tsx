import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import React, { FC, useEffect, useState } from "react";
import { SizeUnit } from "../types";

interface ModalBuilderNumberInputProps {
  name: string;
  id: string;
  unit: SizeUnit;
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
}

const ModalBuilderNumberInput: FC<ModalBuilderNumberInputProps> = ({
  id,
  name,
  unit,
  value,
  onChange,
  className,
  min,
  max,
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender || unit === SizeUnit.NONE) {
      setIsFirstRender(false);
      return;
    }

    const bodyWidth = document.body.clientWidth;

    if (unit === SizeUnit.PERCENTAGE) {
      onChange(Math.round((value * 100) / bodyWidth));
    } else onChange(Math.round((value / 100) * bodyWidth));
  }, [unit]);

  return (
    <div className="relative border rounded-sm border-[#E5E7EB]">
      <input
        id={id}
        name={name}
        type="text"
        className={`!m-0 w-[180px] h-[32px] text-[14px] rounded-md bg-white border-white focus:border-white focus:ring-transparent p-[4px_12px] ${
          className || ""
        }`}
        value={value + unit}
        onChange={(e) => {
          const newValue = +e.target.value
            .split("")
            .filter((char) => !isNaN(+char))
            .join("");

          if (max && newValue > max) {
            onChange(max);
            return;
          }

          if (min && newValue < min) {
            onChange(min);
            return;
          }

          onChange(newValue);
        }}
      />
      <div className="absolute h-full w-[10px] top-1/2 right-[6px] -translate-y-1/2 flex flex-col justify-center items-center">
        <ChevronUpIcon
          className={`cursor-pointer ${value === max ? "text-[#D1D5DB]" : ""}`}
          onClick={() => {
            if (value !== max) onChange(value + 1);
          }}
        />
        <ChevronDownIcon
          className={`cursor-pointer ${value === min ? "text-[#D1D5DB]" : ""}`}
          onClick={() => {
            if (value !== min) onChange(value - 1);
          }}
        />
      </div>
    </div>
  );
};

export default ModalBuilderNumberInput;
