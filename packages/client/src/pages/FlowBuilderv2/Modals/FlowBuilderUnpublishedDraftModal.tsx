import React, { FC } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import { ErrorExclamationIcon } from "../Icons";

interface FlowBuilderUnpublishedDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FlowBuilderUnpublishedDraftModal: FC<
  FlowBuilderUnpublishedDraftModalProps
> = ({ isOpen, onClose, onConfirm }) => {
  const ModalProps = {
    title: "Have an unpublished draft",
    description:
      "Continuing to edit this journey will overwrite your existing draft. Are you sure you want to continue editing?",
    onClose: onClose,
    isOpen,
    closeButtonText: "Cancel",
    confirmButtonText: "Continue Editing",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      onConfirm();
      onClose();
    },
    Icon: ErrorExclamationIcon,
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderUnpublishedDraftModal;
