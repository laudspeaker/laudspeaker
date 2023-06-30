import Modal from "components/Elements/Modalv2";
import NamePerson from "pages/PeopleTable/NamePerson";
import React, { FC } from "react";

interface NamePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NamePersonModal: FC<NamePersonModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <NamePerson isPrimary />
    </Modal>
  );
};

export default NamePersonModal;
