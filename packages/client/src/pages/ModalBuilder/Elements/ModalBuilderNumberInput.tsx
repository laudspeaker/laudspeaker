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
}

const ModalBuilderNumberInput: FC<ModalBuilderNumberInputProps> = ({
  id,
  name,
  unit,
  value,
  onChange,
  className,
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
    <div className="relative">
      <input
        id={id}
        name={name}
        type="text"
        className={`!m-0 max-w-[70px] max-h-[26px] text-[12px] rounded-md bg-transparent border-white focus:border-white focus:ring-transparent p-[4px] ${
          className || ""
        }`}
        value={value + unit}
        onChange={(e) =>
          onChange(
            +e.target.value
              .split("")
              .filter((char) => !isNaN(+char))
              .join("")
          )
        }
      />
      <div className="absolute h-full w-[10px] top-1/2 right-[6px] -translate-y-1/2 flex flex-col justify-center items-center">
        <ChevronUpIcon
          className="cursor-pointer"
          onClick={() => onChange(value + 1)}
        />
        <ChevronDownIcon
          className="cursor-pointer"
          onClick={() => onChange(value - 1)}
        />
      </div>
    </div>
  );
};

export default ModalBuilderNumberInput;
