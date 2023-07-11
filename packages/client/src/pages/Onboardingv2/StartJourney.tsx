import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "store/hooks";
import startJourneyImage from "./svg/start-journey.svg";
import trackPerformanceImage from "./svg/track-performance.svg";

const StartJourney = () => {
  const navigate = useNavigate();

  const email = useAppSelector((state) => state.auth.userData.email);

  const [isTrackPerformance, setIsTrackPerformance] = useState(false);

  const handleOnboarding = async () => {
    navigate("/home");
  };

  return (
    <div className="w-full flex justify-around items-center font-inter font-normal text-[16px] text-[#111827] leading-[24px]">
      <div className="max-w-[390px]">
        <div className="text-[28px] font-semibold leading-normal">
          {isTrackPerformance ? (
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
          ) : (
            "All set 🎉"
          )}
        </div>

        <div className="mt-[20px] text-[56px] font-semibold leading-normal">
          {isTrackPerformance ? "Track performance" : "Start Journey"}
        </div>

        <p className="mt-[20px]">
          {isTrackPerformance ? (
            <>
              You're almost there! Locate the verification email via email{" "}
              <span className="text-[#6366F1]">{email}</span> and click the link
              to unlock the full impact of the onboarding journey.
            </>
          ) : (
            "Add customers manually, import CSV files, or connect with your dataset to create custom segments based on their attributes and behaviors."
          )}
        </p>

        <button
          className="min-w-[200px] w-fit px-[30px] py-[10px] mt-[40px] rounded-[30px] bg-[#6366F1] flex items-center justify-center text-white"
          onClick={
            isTrackPerformance
              ? handleOnboarding
              : () => setIsTrackPerformance(true)
          }
        >
          {isTrackPerformance ? "Get Started in Laudspeaker" : "Start"}
        </button>
      </div>
      <div className="min-w-[300px] max-w-[720px]">
        <img
          src={isTrackPerformance ? trackPerformanceImage : startJourneyImage}
        />
      </div>
    </div>
  );
};

export default StartJourney;
