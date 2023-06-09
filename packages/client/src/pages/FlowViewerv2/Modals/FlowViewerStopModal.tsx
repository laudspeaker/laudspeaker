import FlowBuilderButton from "pages/FlowBuilderv2/Elements/FlowBuilderButton";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import React, { FC } from "react";
import { Node } from "reactflow";
import { removeNode } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";

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
        <div className="flex gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <div className="font-medium text-[16px] leading-[24px]">
              Are you sure to stop the journey?
            </div>
            <div className="font-normal text-[14px] leading-[22px]">
              Please note that stopping the journey is an irreversible action,
              and cannot be resumed
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-[8px]">
          <FlowBuilderButton
            onClick={onClose}
            className="!rounded-[2px] !text-[#111827] !bg-white !border-[1px] !border-[#E5E7EB]"
          >
            Cancel
          </FlowBuilderButton>
          <FlowBuilderButton
            className="!rounded-[2px] bg-[#F43F5E] !border-[1px] !border-[#F43F5E] text-white"
            onClick={handleStop}
          >
            Stop
          </FlowBuilderButton>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowViewerStopModal;
