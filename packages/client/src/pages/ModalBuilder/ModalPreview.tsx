import { FC, useRef } from "react";
import { ModalState } from "./ModalBuilder";
import laudspeakerjs from "@laudspeaker/laudspeaker-js";
import { createRoot } from "react-dom/client";
interface ModalPreviewProps {
  modalState: ModalState;
}
const ModalPreview: FC<ModalPreviewProps> = ({ modalState }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  if (rootRef.current) {
    laudspeakerjs.renderPreview(createRoot(rootRef.current), modalState);
  }
  return <div ref={rootRef}></div>;
};
export default ModalPreview;
