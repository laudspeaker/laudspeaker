import React, { FC } from "react";

interface ModalBuilderPersonalizationButtonProps {
  onClick: () => void;
}

const ModalBuilderPersonalizationButton: FC<
  ModalBuilderPersonalizationButtonProps
> = ({ onClick }) => {
  return (
    <div
      className="min-w-[155px] text-[12px] rounded-md bg-transparent border-white border-[1px] p-[4px] float-left cursor-pointer"
      onClick={onClick}
    >
      Insert variable
    </div>
  );
};

export default ModalBuilderPersonalizationButton;
