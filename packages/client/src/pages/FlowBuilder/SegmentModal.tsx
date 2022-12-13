import { GenericButton, Select } from "components/Elements";
import Modal from "components/Elements/Modal";
import { MySegment } from "pages/Segment";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";

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

  const [possibleSegments, setPossibleSegments] = useState();

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/segments" });
      setPossibleSegments(data);
    })();
  }, []);

  useEffect(() => {
    if (segmentId) {
      // TODO: load segment data
    }
  }, [segmentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isSegmentEditModalOpen ? (
        <MySegment
          onClose={() => setIsSegmentEditModalOpen(false)}
          workflowId={workflowId}
          segmentId={segmentData.id || ""}
          isCollapsible={true}
          onSubmit={() => {}}
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
