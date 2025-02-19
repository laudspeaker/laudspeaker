import React, { FC, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import ArrowRight from "@heroicons/react/20/solid/ChevronRightIcon";
import { useClickAway } from "react-use";
import { createPortal } from "react-dom";

interface InAppBuilderColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const validHexChars = "1234567890ABCDEFabcdef";

const InAppBuilderColorPicker: FC<InAppBuilderColorPickerProps> = ({
  color,
  onChange,
  className,
}) => {
  const [isColorPickerInAppOpen, setIsColorPickerInAppOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pickerRef = useRef(null);

  useClickAway(pickerRef, () => {
    setIsColorPickerInAppOpen(false);
  });

  const inputRect = ref.current?.getBoundingClientRect();
  const left = inputRect ? inputRect.left - (220 - inputRect.width) : 0;
  const top = (inputRect?.top || 0) + 30;

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        className={`!m-0 w-[180px] h-[32px] text-[14px] rounded-sm bg-white border-[#E5E7EB] focus:border-[#E5E7EB] focus:ring-transparent py-[5px] pl-[30px] pr-[12px] ${
          className ? className : ""
        }`}
        value={color}
        onChange={(e) =>
          onChange(
            "#" +
              e.target.value
                .replaceAll("#", "")
                .split("")
                .filter((char) => validHexChars.includes(char))
                .join("")
                .substring(0, 6)
          )
        }
      />
      <div
        className="absolute w-[15px] h-[15px] top-1/2 left-[12px] -translate-y-1/2 rounded cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => setIsColorPickerInAppOpen((prev) => !prev)}
      />
      {isColorPickerInAppOpen &&
        createPortal(
          <div
            ref={pickerRef}
            style={{
              left: left + "px",
              ...(top + 332 > document.body.clientHeight
                ? { bottom: "0px" }
                : { top: top + "px" }),
            }}
            className="absolute select-none z-[2147483647] bg-white text-black"
          >
            <div
              className="flex justify-end items-center px-[10px] cursor-pointer"
              onClick={() => setIsColorPickerInAppOpen(false)}
            >
              X
            </div>
            <SketchPicker
              color={color}
              onChange={(newColor) => onChange(newColor.hex)}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default InAppBuilderColorPicker;
