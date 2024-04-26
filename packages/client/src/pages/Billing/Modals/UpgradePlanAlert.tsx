import ExclamationCircleIcon from "assets/icons/ExclamationCircleIcon";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Modal from "components/Elements/Modalv2";
import React, { FC } from "react";

interface UpgradePlanAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradePlanAlert: FC<UpgradePlanAlertProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
        <div className="flex gap-4">
          <div>
            <ExclamationCircleIcon />
          </div>

          <div className="flex flex-col gap-2 font-roboto">
            <div className="text-[16px] font-medium leading-6">
              Upgrade plan
            </div>
            <div className="">
              You've reached the Active Journey limit (2) of your current plan,
              Free plan. To continue with more usage, please upgrade your plan.
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type={ButtonType.SECONDARY} onClick={onClose}>
            Not now
          </Button>

          <Button type={ButtonType.PRIMARY} onClick={onUpgrade}>
            Upgrade plan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradePlanAlert;
