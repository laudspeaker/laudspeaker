import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { FC, useState } from "react";
import { useAppSelector } from "store/hooks";
import { SettingsTab } from "./Settingsv2";
import guideChevronIcon from "./svg/guide-chevron-icon.svg";
import guideCheckedIcon from "./svg/guide-ckecked-icon.svg";
import guideUnCheckedIcon from "./svg/guide-unckecked-icon.svg";

interface SetupFixture {
  title: string;
  description: string;
  setupTab: SettingsTab;
  done?: boolean;
}

interface SetupGuideProps {
  currentTab: SettingsTab;
  setCurrentTab: (value: SettingsTab) => void;
}

const SetupGuide: FC<SetupGuideProps> = ({ currentTab, setCurrentTab }) => {
  const { messageSetupped, eventProviderSetupped } = useAppSelector(
    (state) => state.onboarding
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [fixturesMarked, setFixturesMarked] = useState<number[]>([]);

  const setupFixtures: SetupFixture[] = [
    {
      title: "Add message channels",
      description:
        "Seamlessly connect your email, SMS, and Slack platforms to reach your customers on their preferred channels.",
      setupTab: SettingsTab.MESSAGE_CHANNEL,
      done: messageSetupped,
    },
    {
      title: "Configure event provider",
      description:
        "Integrate your event provider to create targeted, behavior-based messaging experiences.",
      setupTab: SettingsTab.EVENT_PROVIDER,
      done: eventProviderSetupped,
    },
  ];

  const activeFixture = setupFixtures.find(
    (fixture, i) => !fixture.done && !fixturesMarked.includes(i)
  );

  const activeFixtureIndex = activeFixture
    ? setupFixtures.indexOf(activeFixture)
    : Infinity;

  return (
    <div
      className={`w-[360px] z-[999999999999999] fixed right-[20px] transition-transform bottom-0 ${
        isExpanded ? "" : "translate-y-[calc(100%-64px)]"
      } `}
      style={{
        boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="rounded-t-[8px] bg-[#111827] text-white p-5 flex items-center justify-between">
        <div className="font-inter text-[16px] font-semibold leading-[24px]">
          {setupFixtures.every(
            (fixture, i) => fixture.done || fixturesMarked.includes(i)
          ) ? (
            <>🎉 Finished the setup</>
          ) : (
            <>Setup guide</>
          )}
        </div>

        <button
          className={`transition-transform origin-center ${
            isExpanded ? "" : "rotate-180"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <img src={guideChevronIcon} />
        </button>
      </div>

      <div className="bg-white p-5">
        {setupFixtures.map((fixture, i) => (
          <div
            key={i}
            className={`p-[10px] flex gap-[10px] ${
              activeFixtureIndex === i ? "!py-5" : ""
            }`}
          >
            <div className="min-w-[24px]">
              <img
                src={
                  fixture.done || fixturesMarked.includes(i)
                    ? guideCheckedIcon
                    : guideUnCheckedIcon
                }
              />
            </div>

            <div className="flex flex-col gap-[10px]">
              <div
                className={`font-inter text-[16px] leading-[24px] ${
                  activeFixtureIndex === i ? "font-semibold" : "font-normal"
                } `}
              >
                {fixture.title}
              </div>

              {activeFixtureIndex === i && (
                <>
                  <div className="font-inter text-[14px] leading-[22px] font-normal">
                    {fixture.description}
                  </div>

                  {currentTab === fixture.setupTab ? (
                    <Button
                      className="w-fit"
                      type={ButtonType.SECONDARY}
                      onClick={() => setFixturesMarked([...fixturesMarked, i])}
                    >
                      Mark as completed
                    </Button>
                  ) : (
                    <Button
                      className="w-fit"
                      type={ButtonType.PRIMARY}
                      onClick={() => setCurrentTab(fixture.setupTab)}
                    >
                      Setup now
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupGuide;
