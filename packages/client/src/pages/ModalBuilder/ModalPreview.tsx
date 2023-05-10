import { FC, useEffect } from "react";
import ls from "@laudspeaker/laudspeaker-js";
import { ModalState } from "./types";

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
