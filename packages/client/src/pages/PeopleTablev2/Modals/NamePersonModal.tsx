import Modal from "components/Elements/Modalv2";
import NamePerson from "pages/PeopleTablev2/Modals/NamePerson";
import React, { FC } from "react";

interface NamePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkKey: string;
}

const NamePersonModal: FC<NamePersonModalProps> = ({
  isOpen,
  onClose,
  pkKey,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <NamePerson isPrimary pkKey={pkKey} />
    </Modal>
  );
};

export default NamePersonModal;
