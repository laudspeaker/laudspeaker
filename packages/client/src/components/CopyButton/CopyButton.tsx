import React, { FC } from "react";
import copyIcon from "./svg/copy-icon.svg";

interface CopyButtonProps {
  onClick?: () => void;
}

const CopyButton: FC<CopyButtonProps> = ({ onClick }) => {
  return (
    <button onClick={onClick}>
      <img src={copyIcon} />
    </button>
  );
};

export default CopyButton;
