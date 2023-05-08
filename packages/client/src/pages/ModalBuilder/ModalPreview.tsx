import { FC, useEffect } from "react";
import { ModalState } from "./ModalBuilder";
import ls from "@laudspeaker/laudspeaker-js";

interface ModalPreviewProps {
  modalState: ModalState;
}

const ModalPreview: FC<ModalPreviewProps> = ({ modalState }) => {
  useEffect(() => {
    ls._renderModalState(modalState);
  }, []);

  return <div className="w-full h-screen"></div>;
};
export default ModalPreview;
