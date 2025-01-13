import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { JourneyType, setIsStarting } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import posthog from "posthog-js";
import ConfirmationModal from "components/Elements/ConfirmationModal";

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

  const ModalProps = {
    title: "Are you sure to publish the journey?",
    description:
      "Once you publish, the journey will be active and eligible customers can be messaged",
    onClose: onClose,
    isOpen,
    closeButtonText: "Cancel",
    confirmButtonText: "Publish",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      handleStartJourney();
      onClose();
    },
    confirmButtonId: "journey-start-verify-button",
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderStartModal;
