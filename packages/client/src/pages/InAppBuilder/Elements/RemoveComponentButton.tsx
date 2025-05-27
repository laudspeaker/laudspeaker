import { TrashIcon } from "@heroicons/react/24/outline";
import { GenericButton } from "components/Elements";
import React, { FC, ReactNode } from "react";

interface RemoveComponentButtonProps {
  children: string;
  onClick: () => void;
}

const RemoveComponentButton: FC<RemoveComponentButtonProps> = ({
  children,
  onClick,
}) => {
  return (
    <GenericButton
      onClick={onClick}
      customClasses="!bg-transparent !border-0 !shadow-none !text-red-500 !text-[14px] !font-normal !p-0 !ring-0 !w-fit"
    >
      <div className="flex justify-between items-center">
        <span className="whitespace-nowrap !text-[#EB5757] underline">
          {children
            .split(" ")
            .map((word) => {
              const arr = word.split("");
              arr[0] = arr[0].toUpperCase();
              return arr.join("");
            })
            .join(" ")}
        </span>
      </div>
    </GenericButton>
  );
};

export default RemoveComponentButton;
