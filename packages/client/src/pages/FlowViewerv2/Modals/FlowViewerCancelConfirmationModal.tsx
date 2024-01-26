import Button, { ButtonType } from "components/Elements/Buttonv2";
import Modal from "components/Elements/Modalv2";
import React, { FC } from "react";

interface FlowViewerCancelConfirmationModalProps {
  isOpen: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

const FlowViewerCancelConfirmationModal: FC<
  FlowViewerCancelConfirmationModalProps
> = ({ isOpen, onDiscard, onSave }) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <>
        <div className="flex mb-[24px]">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_493_18800)">
              <path
                d="M11 0C4.92545 0 0 4.92545 0 11C0 17.0746 4.92545 22 11 22C17.0746 22 22 17.0746 22 11C22 4.92545 17.0746 0 11 0ZM11 20.1339C5.9567 20.1339 1.86607 16.0433 1.86607 11C1.86607 5.9567 5.9567 1.86607 11 1.86607C16.0433 1.86607 20.1339 5.9567 20.1339 11C20.1339 16.0433 16.0433 20.1339 11 20.1339Z"
                fill="#F43F5E"
              />
              <path
                d="M9.82104 15.3214C9.82104 15.634 9.94522 15.9338 10.1662 16.1548C10.3873 16.3758 10.687 16.5 10.9996 16.5C11.3122 16.5 11.612 16.3758 11.833 16.1548C12.054 15.9338 12.1782 15.634 12.1782 15.3214C12.1782 15.0089 12.054 14.7091 11.833 14.4881C11.612 14.267 11.3122 14.1429 10.9996 14.1429C10.687 14.1429 10.3873 14.267 10.1662 14.4881C9.94522 14.7091 9.82104 15.0089 9.82104 15.3214ZM10.4103 12.5714H11.5889C11.6969 12.5714 11.7853 12.483 11.7853 12.375V5.69643C11.7853 5.58839 11.6969 5.5 11.5889 5.5H10.4103C10.3023 5.5 10.2139 5.58839 10.2139 5.69643V12.375C10.2139 12.483 10.3023 12.5714 10.4103 12.5714Z"
                fill="#F43F5E"
              />
            </g>
            <defs>
              <clipPath id="clip0_493_18800">
                <rect width="22" height="22" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className="ml-[16px] text-[#111827] font-roboto">
            <div className="font-medium leading-[24px] text-[16px]">
              You have unsaved changes
            </div>
            <div className="leading-[22px] text-[14px] mt-[8px]">
              Please save or discard the changes to continue.
            </div>
          </div>
        </div>
        <div className="flex justify-end flex-nowrap">
          <Button
            id="delete-node"
            type={ButtonType.DANGEROUS}
            onClick={onDiscard}
            className="!px-[15px] !py-[4px] !rounded-none !text-[14px] !leading-[22px] font-inter mr-2"
          >
            Discard
          </Button>
          <Button
            id="delete-node"
            type={ButtonType.PRIMARY}
            onClick={onSave}
            className="!px-[15px] !py-[4px] !rounded-none !text-[14px] !leading-[22px] font-inter"
          >
            Save changes
          </Button>
        </div>
      </>
    </Modal>
  );
};

export default FlowViewerCancelConfirmationModal;
