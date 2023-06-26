import { format } from "date-fns";
import React from "react";
import { useAppSelector } from "store/hooks";
import onboardingBackgroundImage from "./svg/onboarding-background.svg";
import messageSetupBackgroundImage from "./svg/message-setup-background.svg";
import { useNavigate } from "react-router-dom";

const Homev2 = () => {
  const navigate = useNavigate();

  const { firstName } = useAppSelector((state) => state.auth.userData);
  const { onboarded, messageSetupped } = useAppSelector(
    (state) => state.onboarding
  );

  const onboardingFixtures: {
    title: string;
    description: string;
    link: string;
    linkText: string;
    image: string;
    done: boolean;
  }[] = [
    {
      title: "Get started with easy Onboarding",
      description:
        "Get started with our easy onboarding process and unlock the power of personalized communication.",
      image: onboardingBackgroundImage,
      link: "/onboarding",
      linkText: "Get Started Now",
      done: onboarded,
    },
    {
      title: "Setup message service and event provider",
      description:
        "We'll guide you through connecting your message service and event provider for a comprehensive messaging solution.",
      image: messageSetupBackgroundImage,
      link: "",
      linkText: "Setup now",
      done: messageSetupped,
    },
  ];

  const activeFixture = onboardingFixtures.find((fixture) => !fixture.done);

  const activeFixtureIndex = activeFixture
    ? onboardingFixtures.indexOf(activeFixture)
    : -1;

  return (
    <div className="bg-[#F3F4F6] p-[40px] flex flex-col gap-[20px] font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex gap-[16px] items-end">
        <div className="text-[30px] font-roboto font-medium leading-[40px]">
          Welcome, {firstName}
        </div>
        <div>{format(new Date(), "MM/dd/yyyy")}</div>
      </div>

      <div className="flex justify-between gap-[20px]">
        <div className="flex flex-col gap-[20px] w-full">
          <div
            className="p-[20px] text-white rounded-[8px] flex flex-col gap-[20px]"
            style={{
              background:
                "linear-gradient(180deg, #6366F1 0%, #4F46E5 86.46%, #4338CA 100%)",
            }}
          >
            {onboardingFixtures.map((fixture, i) => (
              <div
                className={`flex justify-between ${
                  i !== 0 ? "border-t-[1px] border-white pt-[20px]" : ""
                }`}
                key={i}
              >
                <div className="flex flex-col gap-[20px]">
                  <div className="flex gap-[10px] items-center">
                    <div>
                      {fixture.done ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 8.26389L7.61111 10.875L11.5278 5"
                            stroke="white"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="8" cy="8" r="7.5" stroke="white" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="8" cy="8" r="7.5" stroke="white" />
                        </svg>
                      )}
                    </div>

                    <div
                      className={`${
                        i === activeFixtureIndex
                          ? "text-[20px] font-semibold leading-[28px]"
                          : ""
                      }`}
                    >
                      {fixture.title}
                    </div>
                  </div>

                  {i === activeFixtureIndex && (
                    <>
                      <div>{fixture.description}</div>

                      <button
                        className="px-[20px] py-[10px] bg-[#6366F1] rounded-[8px] w-fit font-semibold leading-[20px]"
                        onClick={() => navigate(fixture.link)}
                      >
                        {fixture.linkText}
                      </button>
                    </>
                  )}
                </div>

                {i === activeFixtureIndex && <img src={fixture.image} />}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-[360px] w-[360px]">3</div>
      </div>
    </div>
  );
};

export default Homev2;
