import segmentCustomersImage from "./svg/segment-customers.svg";
import React, { FC } from "react";
import { useAppSelector } from "store/hooks";

interface SelectCustomersProps {
  onSendEmailClick: () => void;
}

const SelectCustomers: FC<SelectCustomersProps> = ({ onSendEmailClick }) => {
  const email = useAppSelector((state) => state.auth.userData.email);

  return (
    <div className="w-full flex justify-around items-center font-inter font-normal text-[16px] text-[#111827] leading-[24px]">
      <div className="max-w-[390px]">
        <div className="text-[56px] font-semibold leading-normal">
          Segment customers
        </div>

        <p className="mt-[20px]">
          Add customers manually, import CSV files, or connect with your dataset
          to create custom segments based on their attributes and behaviors.
          <br />
          <br />
          Let's send the onboarding email to your verified email:{" "}
          <span className="text-[#6366F1]">{email}</span>
        </p>

        <button
          className="max-w-[200px] w-full px-[30px] py-[10px] mt-[40px] rounded-[30px] bg-[#6366F1] flex items-center justify-center text-white"
          onClick={onSendEmailClick}
        >
          Send email
        </button>
      </div>
      <div className="min-w-[300px] max-w-[720px]">
        <img src={segmentCustomersImage} />
      </div>
    </div>
  );
};

export default SelectCustomers;
