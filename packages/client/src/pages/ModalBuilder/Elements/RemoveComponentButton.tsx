import { TrashIcon } from "@heroicons/react/24/outline";
import { GenericButton } from "components/Elements";
import React, { FC, ReactNode } from "react";

interface RemoveComponentButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const RemoveComponentButton: FC<RemoveComponentButtonProps> = ({
  children,
  onClick,
}) => {
  return (
    <GenericButton
      onClick={onClick}
      customClasses="!bg-transparent !text-red-500 !text-[14px] !font-normal !p-0 !ring-0"
    >
      <div className="flex justify-between items-center">
        <span className="whitespace-nowrap !text-[#EB5757] underline">
          {children}
        </span>
      </div>
    </GenericButton>
  );
};

export default RemoveComponentButton;
