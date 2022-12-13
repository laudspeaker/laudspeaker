import { GenericButton, Select } from "components/Elements";
import Modal from "components/Elements/Modal";
import { MySegment } from "pages/Segment";
import React, { FC, useEffect, useState } from "react";

export interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId?: string;
  setSegmentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  workflowId: string;
}

const SegmentModal: FC<SegmentModalProps> = ({
  isOpen,
  onClose,
  segmentId,
  setSegmentId,
  workflowId,
}) => {
  const [isSegmentEditModalOpen, setIsSegmentEditModalOpen] = useState(false);
  const [segmentData, setSegmentData] = useState({
    id: segmentId,
    inclusionCriteria: {},
    isFreezed: false,
  });

  useEffect(() => {
    if (segmentId) {
    }
  }, [segmentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isSegmentEditModalOpen ? (
        <MySegment
          onClose={() => setIsSegmentEditModalOpen(false)}
          workflowId={workflowId}
          isCollapsible={true}
        />
      ) : (
        <div>
          <Select value={""} onChange={() => {}} options={[]} />
          <div>
            <GenericButton onClick={() => {}}>Export</GenericButton>
            <GenericButton onClick={() => {}}>Copy</GenericButton>
            {segmentId && !segmentData.isFreezed && (
              <GenericButton onClick={() => {}}>Edit</GenericButton>
            )}
            <GenericButton onClick={() => setIsSegmentEditModalOpen(true)}>
              New
            </GenericButton>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SegmentModal;
