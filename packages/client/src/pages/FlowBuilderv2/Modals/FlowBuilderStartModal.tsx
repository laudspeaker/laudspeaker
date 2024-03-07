import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { JourneyType, setIsStarting } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
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
  const {
    flowId,
    nodes,
    edges,
    flowName,
    segments,
    journeyType,
    journeyEntrySettings,
    journeySettings,
    isStarting,
  } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const handleStartJourney = async () => {
    if (isStarting) {
      toast.error("Journey is already starting");
      return;
    }

    dispatch(setIsStarting(true));
    toast.info(
      "Please remain on page until journey has started this can take a few minutes"
    );

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
      dispatch(setIsStarting(false));
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
          journeyEntrySettings,
          journeySettings,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Error: failed to save journey properties");
      dispatch(setIsStarting(false));
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

    dispatch(setIsStarting(false));
  };

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto">
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <div className="font-medium text-base">
              Are you sure to start the journey?
            </div>
            <div className="font-normal text-[14px] leading-[22px]">
              Once you start, eligible customers can be messaged.
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mt-[24px] gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              handleStartJourney();
              onClose();
            }}
            id="journey-start-verify-button"
          >
            Start
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowBuilderStartModal;
