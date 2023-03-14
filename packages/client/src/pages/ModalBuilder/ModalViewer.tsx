import React, { FC } from "react";
import { ModalState } from "./ModalBuilder";

interface ModalViewerProps {
  modalState: ModalState;
}

const ModalViewer: FC<ModalViewerProps> = () => {
  return <div>ModalViewer</div>;
};

export default ModalViewer;
