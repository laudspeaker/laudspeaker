import Button, { ButtonType } from "components/Elements/Buttonv2";
import Modal from "components/Elements/Modalv2";
import React, { FC } from "react";
import ApiService from "services/api.service";

interface DeleteJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId?: string;
}

const DeleteJourneyModal: FC<DeleteJourneyModalProps> = ({
  isOpen,
  onClose,
  journeyId,
}) => {
  const handleDeleteJourney = async () => {
    if (!journeyId) return;

    await ApiService.patch({ url: "/journeys/delete/" + journeyId });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="font-roboto font-medium text-[16px] text-[#111827] leading-[24px]">
        Are you sure to delete the journey?
      </div>
      <div className="mt-[8px]">
        Please note that deleting the journey is an irreversible action.
      </div>

      <div className="mt-[24px] flex items-center justify-end gap-2 font-roboto font-normal text-[14px] text-[#111827] leading-[22px]">
        <Button type={ButtonType.SECONDARY} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type={ButtonType.DANGEROUS}
          onClick={handleDeleteJourney}
          disabled={!journeyId}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteJourneyModal;
