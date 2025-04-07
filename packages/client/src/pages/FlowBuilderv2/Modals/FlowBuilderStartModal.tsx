import React, { FC } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import useStartJourney from "../hooks/handleStartJourney";

interface FlowBuilderStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowBuilderStartModal: FC<FlowBuilderStartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleStartJourney = useStartJourney();

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
      handleStartJourney({});
      onClose();
    },
    confirmButtonId: "journey-start-verify-button",
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderStartModal;
