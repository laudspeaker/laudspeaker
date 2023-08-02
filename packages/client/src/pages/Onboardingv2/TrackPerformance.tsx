import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "store/hooks";
import trackPerformanceImage from "./svg/track-performance.svg";

interface TrackPerformanceProps {
  onFinish: () => void;
}

const TrackPerformance: FC<TrackPerformanceProps> = ({ onFinish }) => {
  const navigate = useNavigate();

  const email = useAppSelector((state) => state.auth.userData.email);

  return (
    <div className="w-full flex justify-center font-inter font-normal text-[16px] text-[#111827] leading-[24px] mt-[76px] px-[55px] pb-[40px]">
      <div className="max-w-[1440px] flex justify-between gap-[80px]">
        <div className="max-w-[390px] mt-[104px]">
          <div className="text-[28px] font-semibold leading-normal">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
            >
              <path
                d="M10.4531 29.0986V32.0986M22.4531 20.0986V32.0986M34.4531 11.0986V32.0986"
                stroke="black"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-[20px] text-[56px] font-semibold leading-normal">
            Track performance
          </div>

          <p className="mt-[20px]">
            You're almost there! Locate the verification email via email{" "}
            <span className="text-[#6366F1]">{email}</span> and click the link
            to unlock the full impact of the onboarding journey.
          </p>

          <button
            className="min-w-[200px] w-fit px-[30px] py-[10px] mt-[40px] rounded-[30px] bg-[#6366F1] flex items-center justify-center text-white"
            onClick={() => {
              onFinish();
              navigate("/home");
            }}
          >
            Get Started in Laudspeaker
          </button>
        </div>
        <div className="min-w-[300px] max-w-[820px]">
          <img src={trackPerformanceImage} />
        </div>
      </div>
    </div>
  );
};

export default TrackPerformance;
