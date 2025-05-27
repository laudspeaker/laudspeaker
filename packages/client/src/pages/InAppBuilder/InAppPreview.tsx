import { FC, useEffect } from "react";
import ls from "@laudspeaker/laudspeaker-js";
import { InAppState } from "./types";
import { ModalState } from "@laudspeaker/laudspeaker-js/dist/types";

interface InAppPreviewProps {
  inAppState: InAppState;
}

const InAppPreview: FC<InAppPreviewProps> = ({ inAppState }) => {
  useEffect(() => {
    ls._renderModalState(inAppState as unknown as ModalState);
  }, []);

  return <div className="w-full h-screen"></div>;
};
export default InAppPreview;
