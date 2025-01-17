import React, { FC, useState } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import Select from "components/Elements/Selectv2";
import posthog from "posthog-js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { setIsStarting, JourneyType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector, useAppDispatch } from "store/hooks";

interface PublishVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const options = {
  copy: {
    inProgress: {
      title: "Users in Progress",
      options: [
        { key: "restart", title: "Restart" },
        { key: "continue", title: "Continue with the new version" },
        { key: "finish", title: "Stop, user will not see the new version" },
      ],
      placeholder: "Select the transition way",
    },
    finished: {
      title: "Finished users",
      options: [
        { key: "restart", title: "Restart" },
        { key: "remain finished", title: "Remain finished" },
      ],
      placeholder: "Select the transition way",
    },
  },
  structure: {
    inProgress: {
      title: "Users in Progress",
      options: [
        { key: "restart", title: "Restart" },
        { key: "finish", title: "Stop, user will not see the new version" },
      ],
      placeholder: "Select the transition way",
    },
    finished: {
      title: "Finished users",
      options: [
        { key: "restart", title: "Restart" },
        { key: "remain finished", title: "Remain finished" },
      ],
      placeholder: "Select the transition way",
    },
  },
};

const PublishVersionModal: FC<PublishVersionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [inProgressValue, setInProgressValue] = useState("");
  const [finishedValue, setFinishedValue] = useState("");
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

  const TransitionOptions = () => {
    const type = "copy";
    return (
      <div className="flex flex-col gap-2">
        <hr className="border-t border-[#E5E7EB] my-2" />
        <div className="font-medium text-base">
          Transition users to the new version
        </div>
        <div className="font-normal text-[14px]">
          <div className="flex items-center gap-2 w-full">
            <label className="font-medium text-sm flex-1">
              {options[type].inProgress.title}
            </label>
            <Select
              value={inProgressValue}
              options={options[type].inProgress.options}
              onChange={setInProgressValue}
              placeholder={options[type].inProgress.placeholder}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 w-full">
            <label className="font-medium text-sm mt-4 flex-1">
              {options[type]?.finished?.title}
            </label>
            <Select
              options={options[type].finished.options}
              placeholder={options[type].finished.placeholder}
              value={finishedValue}
              onChange={setFinishedValue}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    );
  };

  const ModalProps = {
    title: "Publish Journey",
    description:
      "Once you publish, the journey will be active and eligible customers can be messaged.",
    onClose: onClose,
    isOpen,
    closeButtonText: "Cancel",
    confirmButtonText: "Publish",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      handleStartJourney();
      onClose();
    },
    headerClassName: "gap-0",
  };

  return (
    <ConfirmationModal {...ModalProps}>
      <TransitionOptions />
    </ConfirmationModal>
  );
};

export default PublishVersionModal;
