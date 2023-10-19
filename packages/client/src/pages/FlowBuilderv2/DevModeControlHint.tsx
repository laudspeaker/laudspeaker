import { useState } from "react";
import { ControlButton } from "reactflow";
import XMarkIcon from "@heroicons/react/20/solid/XMarkIcon";
import ArrowUpIcon from "@heroicons/react/20/solid/ArrowUpIcon";
import ArrowDownIcon from "@heroicons/react/20/solid/ArrowDownIcon";
import ArrowLeftIcon from "@heroicons/react/20/solid/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/20/solid/ArrowRightIcon";
import ArrowUturnRightIcon from "@heroicons/react/20/solid/ArrowUturnRightIcon";
import { motion } from "framer-motion";

const DevModeControlHint = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <ControlButton
      className={`${
        expanded && "!p-[15px] !w-[220px] !h-[172px]"
      } mt-[20px] !outline-none absolute !rounded-sm !border-[1px] !border-[#E5E7EB] !bg-[#FFFBEB] transition-all`}
      onClick={() => setExpanded(true)}
    >
      {expanded ? (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
            delay: 0.1,
          }}
          className="w-full h-full flex flex-col items-start justify-start cursor-default"
        >
          <div className="w-full flex justify-between items-center">
            <div className="px-[6px] py-[2px] flex bg-white items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="transparent"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="black"
                className="w-[14px] h-[14px]"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="transparent"
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
              <div className="text-gray-900 text-[14px] font-semibold font-inter ml-[6px] leading-snug">
                Shortcuts
              </div>
            </div>
            <XMarkIcon
              className="p-[2px] min-w-[20px] min-h-[20px] cursor-pointer"
              onClick={(ev) => {
                ev.stopPropagation();
                setExpanded(false);
              }}
            />
          </div>
          <div className="mt-[20px] w-full">
            <div className="w-full flex justify-between py-[10px]">
              <span className="text-[14px] font-medium text-[#111827] leading-[22px]">
                Navigate steps
              </span>
              <div className="flex items-center justify-between gap-[5px]">
                <div className="px-[4px] py-[4px] border-[1px] rounded border-[#111827]">
                  <ArrowUpIcon className="min-w-[12px] min-h-[12px] text-[#111827]" />
                </div>
                <div className="px-[4px] py-[4px] border-[1px] rounded border-[#111827]">
                  <ArrowDownIcon className="min-w-[12px] min-h-[12px] text-[#111827]" />
                </div>
                <span className="text-[14px] leading-[22px] text-[#111827] font-inter">
                  or Click
                </span>
              </div>
            </div>
            <div className="w-full flex justify-between py-[10px]">
              <span className="text-[14px] font-medium text-[#111827] leading-[22px]">
                Select branches
              </span>
              <div className="flex items-center justify-between gap-[5px]">
                <div className="px-[4px] py-[4px] border-[1px] rounded border-[#111827]">
                  <ArrowLeftIcon className="min-w-[12px] min-h-[12px] text-[#111827]" />
                </div>
                <div className="px-[4px] py-[4px] border-[1px] rounded border-[#111827]">
                  <ArrowRightIcon className="min-w-[12px] min-h-[12px] text-[#111827]" />
                </div>
              </div>
            </div>
            <div className="w-full flex justify-between py-[10px]">
              <span className="text-[14px] font-medium text-[#111827] leading-[22px]">
                Edit a step
              </span>
              <div className="flex items-center justify-between gap-[5px]">
                <div className="px-[4px] py-[4px] border-[1px] rounded border-[#111827]">
                  <ArrowUturnRightIcon className="min-w-[12px] min-h-[12px] text-[#111827] rotate-180" />
                </div>
                <span className="text-[14px] leading-[22px] text-[#111827] font-inter">
                  or Double Click
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="transparent"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="black"
          className="w-[14px] h-[14px]"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="transparent"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
      )}
    </ControlButton>
  );
};

export { DevModeControlHint };
