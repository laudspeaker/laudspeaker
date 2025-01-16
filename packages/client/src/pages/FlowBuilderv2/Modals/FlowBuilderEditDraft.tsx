import { FC } from "react";
import ConfirmationModal from "components/Elements/ConfirmationModal";
import { ErrorExclamationIcon } from "../Icons";

interface FlowBuilderEditDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const FlowBuilderEditDraftModal: FC<FlowBuilderEditDraftModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const ModalProps = {
    title: "Have an unpublished draft",
    description:
      "Continuing to edit this journey will overwrite your existing draft. Do you want to continue editing or create a new draft?",
    onClose: onClose,
    isOpen,
    closeButtonText: "Create a new Draft",
    confirmButtonText: "Continue Editing",
    confirmButtonAction: () => {
      onConfirm();
      onClose();
    },
    closeButtonAction: () => {
      onCancel();
      onClose();
    },
    Icon: ErrorExclamationIcon,
  };

  return <ConfirmationModal {...ModalProps} />;
};

export default FlowBuilderEditDraftModal;
