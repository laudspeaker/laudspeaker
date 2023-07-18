import React, { FC } from "react";
import backIcon from "./svg/back-icon.svg";

interface BackButtonProps {
  onClick?: () => void;
}

const BackButton: FC<BackButtonProps> = ({ onClick }) => {
  return (
    <button
      className="px-[8px] py-[10px] rounded-[4px] border-[1px] border-[#D1D5DB]"
      onClick={onClick || (() => window.history.back())}
    >
      <img src={backIcon} />
    </button>
  );
};

export default BackButton;
