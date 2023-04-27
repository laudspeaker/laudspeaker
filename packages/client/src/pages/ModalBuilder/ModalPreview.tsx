import React, { FC } from "react";
import { ModalState } from "./ModalBuilder";
import { Modal } from "@laudspeaker/laudspeaker-js";

interface ModalPreviewProps {
  modalState: ModalState;
}

const ModalPreview: FC<ModalPreviewProps> = ({ modalState }) => {
  return <Modal modalState={modalState} />;
};
export default ModalPreview;
