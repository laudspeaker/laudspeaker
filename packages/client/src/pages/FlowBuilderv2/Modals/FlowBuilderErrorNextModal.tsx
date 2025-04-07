import React, { FC } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import { ErrorExclamationIcon } from "../Icons";

interface FlowBuilderErrorNextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowBuilderErrorNextModal: FC<FlowBuilderErrorNextModalProps> = ({
  isOpen,
  onClose,
}) => {
  const renderDescription = () => {
    return (
      <>
        Please complete all required fields (
        <span className="text-red-600">marked in red</span>) before proceeding
        to the next step.
      </>
    );
  };

  const ModalProps = {
    title: "Please complete all fields",
    renderDescription,
    onClose,
    isOpen,
    confirmButtonText: "Ok",
    confirmButtonAction: onClose,
    Icon: ErrorExclamationIcon,
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderErrorNextModal;
