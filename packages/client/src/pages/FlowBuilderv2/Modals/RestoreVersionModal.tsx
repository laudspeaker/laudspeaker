import React, { FC } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import { ErrorExclamationIcon } from "../Icons";

interface RestoreVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  versionName: string;
}

const RestoreVersionModal: FC<RestoreVersionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  versionName,
}) => {
  const ModalProps = {
    title: "Have an unpublished draft",
    description: `Continuing to restore ${versionName} will overwrite your existing draft. Are you sure you want to continue restore?`,
    onClose: onClose,
    isOpen,
    closeButtonText: "Cancel",
    confirmButtonText: "Continue Restore",
    closeButtonAction: onClose,
    confirmButtonAction: () => {
      onConfirm();
      onClose();
    },
    Icon: ErrorExclamationIcon,
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default RestoreVersionModal;
