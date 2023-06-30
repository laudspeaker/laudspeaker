import Modal from "components/Elements/Modalv2";
import NameSegment from "pages/SegmentTable/NameSegment";
import React, { FC } from "react";

interface NameSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NameSegmentModal: FC<NameSegmentModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <NameSegment />
    </Modal>
  );
};

export default NameSegmentModal;
