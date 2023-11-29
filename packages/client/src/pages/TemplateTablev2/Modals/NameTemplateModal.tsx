import Modal from "components/Elements/Modalv2";
import NameTemplate from "pages/TemplateTablev2/Modals/NameTemplate";
import React, { FC } from "react";

interface NameTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NameTemplateModal: FC<NameTemplateModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <NameTemplate isPrimary={true} />
    </Modal>
  );
};

export default NameTemplateModal;
