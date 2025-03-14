import React, { FC, useState } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import Select from "components/Elements/Selectv2";
import useStartJourney from "../hooks/handleStartJourney";

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
  const [inProgress, setInProgress] = useState("");
  const [finished, setFinished] = useState("");

  const handleStartJourney = useStartJourney();

  const TransitionOptions = () => {
    const type = "copy";
    return (
      <div className="flex flex-col gap-2 font-inter">
        <hr className="border-t border-[#E5E7EB] my-2" />
        <div className="font-inter font-semibold">
          Transition users to the new version
        </div>
        <div className="font-normal text-[14px]">
          <div className="flex items-center gap-3 w-full">
            <label className="font-inter text-sm color-[#111827] min-w-[120px]">
              {options[type].inProgress.title}
            </label>
            <Select
              value={inProgress}
              options={options[type].inProgress.options}
              onChange={setInProgress}
              placeholder={options[type].inProgress.placeholder}
              className="flex-1 w-full"
              placeholderClassName="font-inter text-[14px] text-[#6B7280]"
              buttonClassName="w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <label className="font-inter text-sm color-[#111827] min-w-[120px]">
              {options[type]?.finished?.title}
            </label>
            <Select
              options={options[type].finished.options}
              placeholder={options[type].finished.placeholder}
              value={finished}
              onChange={setFinished}
              className="flex-1 w-full"
              placeholderClassName="font-inter text-[14px] text-[#6B7280]"
              buttonClassName="w-full"
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
      handleStartJourney({ inProgress, finished });
      onClose();
    },
    headerClassName: "!gap-0",
    modalClassName: "min-w-[500px]",
    titleClassName: "!text-[20px] font-inter font-semibold",
    isDisabled: !(inProgress && finished),
  };

  return (
    <ConfirmationModal {...ModalProps}>
      <TransitionOptions />
    </ConfirmationModal>
  );
};

export default PublishVersionModal;
