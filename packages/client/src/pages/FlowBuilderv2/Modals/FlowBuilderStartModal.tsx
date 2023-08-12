import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { JourneyType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FlowBuilderModal from "../Elements/FlowBuilderModal";
import posthog from "posthog-js";

interface FlowBuilderStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowBuilderStartModal: FC<FlowBuilderStartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { flowId, nodes, edges, flowName, segments, journeyType } =
    useAppSelector((state) => state.flowBuilder);

  const navigate = useNavigate();

  const handleStartJourney = async () => {
    try {
      await ApiService.patch({
        url: "/journeys/visual-layout",
        options: {
          id: flowId,
          nodes,
          edges,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save layout");
      return;
    }

    try {
      await ApiService.patch({
        url: "/journeys",
        options: {
          id: flowId,
          name: flowName,
          inclusionCriteria: segments,
          isDynamic: journeyType === JourneyType.DYNAMIC,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save journey properties");
      return;
    }

    try {
      await ApiService.patch({ url: "/journeys/start/" + flowId });

      toast.success("Journey has been started");
      posthog.capture("journey_started_success");

      navigate(`/flow/${flowId}/view`);
    } catch (e) {
      toast.error("Failed to start journey");
      posthog.capture("journey_started_fail");
    }
  };

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="flex gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <div className="font-medium text-[16px] leading-[24px]">
              Are you sure to start the journey?
            </div>
            <div className="font-normal text-[14px] leading-[22px]">
              Once you start, eligible customers can be messaged.
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-[8px]">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              handleStartJourney();
              onClose();
            }}
          >
            Start
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderStartModal;
