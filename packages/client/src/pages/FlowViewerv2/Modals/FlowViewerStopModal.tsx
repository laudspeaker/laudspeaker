import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import React, { FC } from "react";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";

interface FlowViewerStopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowViewerStopModal: FC<FlowViewerStopModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { flowId } = useAppSelector((state) => state.flowBuilder);

  const handleStop = async () => {
    await ApiService.patch({ url: "/journeys/stop/" + flowId });

    window.location.reload();
  };

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <div className="font-medium text-[16px] leading-[24px]">
              Are you sure to stop the journey?
            </div>
            <div className="font-normal text-[14px] leading-[22px]">
              Please note that stopping the journey is an irreversible action,
              and cannot be resumed
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            className="!rounded-sm bg-[#F43F5E] !border !border-[#F43F5E] text-white"
            onClick={handleStop}
          >
            Stop
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowViewerStopModal;
