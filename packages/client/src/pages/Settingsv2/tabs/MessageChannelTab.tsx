import React from "react";
import arrowRightIconImage from "../svg/arrow-right.svg";
import emailCardIconImage from "../svg/email-card-icon.svg";
import twilioCardIconImage from "../svg/twilio-card-icon.svg";
import customModalCardIconImage from "../svg/custom-modal-card-icon.svg";
import slackCardIconImage from "../svg/slack-card-icon.svg";
import firebaseCardIconImage from "../svg/firebase-card-icon.svg";

export enum MessageChannel {
  EMAIL,
  TWILIO,
  CUSTOM_MODAL,
  SLACK,
  FIREBASE,
}

interface MessageChannelCardFixture {
  id: MessageChannel;
  title: string;
  icon: string;
  beta?: boolean;
  onClick?: () => void;
  connected?: boolean;
}

const MessageChannelTab = () => {
  const messageChannelCardsFixtures: Record<
    MessageChannel,
    MessageChannelCardFixture
  > = {
    [MessageChannel.EMAIL]: {
      id: MessageChannel.EMAIL,
      title: "Email",
      icon: emailCardIconImage,
    },
    [MessageChannel.TWILIO]: {
      id: MessageChannel.TWILIO,
      title: "Twilio SMS",
      icon: twilioCardIconImage,
    },
    [MessageChannel.CUSTOM_MODAL]: {
      id: MessageChannel.CUSTOM_MODAL,
      title: "Custom modal",
      icon: customModalCardIconImage,
    },
    [MessageChannel.SLACK]: {
      id: MessageChannel.SLACK,
      title: "Slack",
      icon: slackCardIconImage,
      beta: true,
    },
    [MessageChannel.FIREBASE]: {
      id: MessageChannel.FIREBASE,
      title: "Firebase",
      icon: firebaseCardIconImage,
      beta: true,
    },
  };

  const connectedFixtures = Object.values(messageChannelCardsFixtures).filter(
    (fixture) => fixture.connected
  );

  const supportedFixtures = Object.values(messageChannelCardsFixtures).filter(
    (fixture) => !fixture.connected
  );

  return (
    <div className="p-[20px] flex flex-col gap-[20px]">
      <div className="text-[#4B5563]">
        Description Description Description Description Description Description
        Description Description Description Description Description Description
        Description Description{" "}
        <button className="text-[#111827] font-bold underline">
          Documentation
        </button>
      </div>

      <div className="w-full h-[1px] bg-[#E5E7EB]" />

      {connectedFixtures.length > 0 && (
        <>
          <div className="font-inter text-[16px] font-semibold leading-[24px]">
            Connected channels
          </div>

          {connectedFixtures.map((fixture, i) => (
            <button
              key={i}
              className="p-[20px] rounded-[8px] bg-[#F9FAFB] border-[1px] border-[#E5E7EB] flex justify-between items-center"
            >
              <div className="flex items-center gap-[10px]">
                <div>
                  <img src={fixture.icon} />
                </div>

                <div className="text-[#18181B] font-inter text-[16px] leading-[24px]">
                  {fixture.title}
                </div>

                {fixture.beta && (
                  <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-[20px] text-[#4B5563] border-[1px] border-[#E5E7EB] bg-white">
                    Beta
                  </div>
                )}
              </div>

              <div>
                <img src={arrowRightIconImage} />
              </div>
            </button>
          ))}
        </>
      )}

      {connectedFixtures.length > 0 && supportedFixtures.length > 0 && (
        <div className="w-full h-[1px] bg-[#E5E7EB]" />
      )}

      {supportedFixtures.length > 0 && (
        <>
          <div className="font-inter text-[16px] font-semibold leading-[24px]">
            Supported channels
          </div>

          {supportedFixtures.map((fixture, i) => (
            <button
              key={i}
              className="p-[20px] rounded-[8px] bg-[#F9FAFB] border-[1px] border-[#E5E7EB] flex justify-between items-center"
            >
              <div className="flex items-center gap-[10px]">
                <div>
                  <img src={fixture.icon} />
                </div>

                <div className="text-[#18181B] font-inter text-[16px] leading-[24px]">
                  {fixture.title}
                </div>

                {fixture.beta && (
                  <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-[20px] text-[#4B5563] border-[1px] border-[#E5E7EB] bg-white">
                    Beta
                  </div>
                )}
              </div>

              <div>
                <img src={arrowRightIconImage} />
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default MessageChannelTab;
