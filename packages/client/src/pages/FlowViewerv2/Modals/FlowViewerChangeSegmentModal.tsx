import Button, { ButtonType } from "components/Elements/Buttonv2";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import React, { FC, useEffect, useState } from "react";

export enum ChangeSegmentOption {
  CONTINUE_JOURNEY = "continue",
  REMOVE_USERS = "remove-user",
}

interface FlowViewerChangeSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (changeSegmentOption: ChangeSegmentOption) => void;
}

const FlowViewerChangeSegmentModal: FC<FlowViewerChangeSegmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [changeSegmentOption, setChangeSegmentOption] =
    useState<ChangeSegmentOption>();

  useEffect(() => {
    setChangeSegmentOption(undefined);
  }, [isOpen]);

  return (
    <FlowBuilderModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6 font-roboto text-[14px] font-normal leading-[22px] text-[#111827]">
        <div className="flex flex-col gap-2">
          <div className="font-inter text-[20px] font-semibold leading-[28px]">
            Changing Eligible Users
          </div>
          <div>
            Changes to this journey will impact eligible users, potentially
            including or excluding certain users from continuing.
          </div>
          <div className="mt-[5px] h-[1px] bg-[#E5E7EB]" />
          <div className="font-inter text-[16px] font-semibold leading-[24px]">
            Manage No Longer Eligible Users
          </div>
          <div
            className="flex items-center gap-2 select-none"
            onClick={() =>
              setChangeSegmentOption(ChangeSegmentOption.CONTINUE_JOURNEY)
            }
          >
            <input
              type="radio"
              checked={
                changeSegmentOption === ChangeSegmentOption.CONTINUE_JOURNEY
              }
            />
            <div>Continue Journey: Retain ineligible users.</div>
          </div>
          <div
            className="flex items-center gap-2 select-none"
            onClick={() =>
              setChangeSegmentOption(ChangeSegmentOption.REMOVE_USERS)
            }
          >
            <input
              type="radio"
              checked={changeSegmentOption === ChangeSegmentOption.REMOVE_USERS}
            />
            <div>Remove Users: Exclude ineligible users.</div>
          </div>
        </div>
        <div className="flex justify-end items-center gap-2">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => changeSegmentOption && onSave(changeSegmentOption)}
            disabled={!changeSegmentOption}
          >
            Save
          </Button>
        </div>
      </div>
    </FlowBuilderModal>
  );
};

export default FlowViewerChangeSegmentModal;
