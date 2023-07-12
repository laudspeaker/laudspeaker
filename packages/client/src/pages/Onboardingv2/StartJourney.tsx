import React, { FC } from "react";
import startJourneyImage from "./svg/start-journey.svg";

interface StartJourneyProps {
  onStartClick?: () => void;
}

const StartJourney: FC<StartJourneyProps> = ({ onStartClick }) => {
  return (
    <div className="w-full flex justify-center font-inter font-normal text-[16px] text-[#111827] leading-[24px] mt-[76px] px-[55px] pb-[40px]">
      <div className="max-w-[1440px] flex justify-between gap-[80px]">
        <div className="max-w-[390px] mt-[104px]">
          <div className="text-[28px] font-semibold leading-normal">
            All set 🎉
          </div>

          <div className="mt-[20px] text-[56px] font-semibold leading-normal">
            Start Journey
          </div>

          <p className="mt-[20px]">
            Add customers manually, import CSV files, or connect with your
            dataset to create custom segments based on their attributes and
            behaviors.
          </p>

          <button
            className="min-w-[200px] w-fit px-[30px] py-[10px] mt-[40px] rounded-[30px] bg-[#6366F1] flex items-center justify-center text-white"
            onClick={onStartClick}
          >
            Start
          </button>
        </div>
        <div className="min-w-[300px] max-w-[820px]">
          <img src={startJourneyImage} />
        </div>
      </div>
    </div>
  );
};

export default StartJourney;
