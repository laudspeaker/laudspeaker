import React, { useEffect, useState } from "react";
import arrowRightIconImage from "../svg/arrow-right.svg";
import emailCardIconImage from "../svg/email-card-icon.svg";
import twilioCardIconImage from "../svg/twilio-card-icon.svg";
import customModalCardIconImage from "../svg/custom-modal-card-icon.svg";
import slackCardIconImage from "../svg/slack-card-icon.svg";
import pushLogoIcon from "../svg/push-logo-icon.svg";
import { useNavigate } from "react-router-dom";
import Account from "types/Account";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import { EmailSendingService } from "pages/EmailSettings/EmailSettings";

export enum MessageChannel {
  EMAIL,
  TWILIO,
  CUSTOM_MODAL,
  SLACK,
  PUSH,
}

interface MessageChannelAdditionalInfoFixture {
  key: keyof Account;
  title: string;
}

interface MessageChannelCardFixture {
  id: MessageChannel;
  title: string;
  icon: string;
  beta?: boolean;
  commingSoon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  connected?: boolean;
  additionalInfo?: MessageChannelAdditionalInfoFixture[];
}

const emailServiceToAdditionalInfoMap: Record<
  EmailSendingService,
  MessageChannelAdditionalInfoFixture[]
> = {
  [EmailSendingService.MAILGUN]: [
    { key: "sendingDomain", title: "Domain" },
    { key: "sendingName", title: "Sending name" },
    { key: "sendingEmail", title: "Sending email" },
  ],
  [EmailSendingService.SENDGRID]: [
    { key: "sendgridFromEmail", title: "Sending email" },
  ],
};

const MessageChannelTab = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<Account>();

  const isEmailConnected = Boolean(
    (account?.emailProvider === EmailSendingService.MAILGUN &&
      account.mailgunAPIKey &&
      account.sendingDomain &&
      account.sendingEmail &&
      account.sendingName) ||
      (account?.emailProvider === EmailSendingService.SENDGRID &&
        account.sendgridApiKey &&
        account.sendgridVerificationKey &&
        account.sendgridFromEmail)
  );

  const isTwilioConnected = Boolean(
    account?.smsAccountSid && account.smsAuthToken && account.smsFrom
  );

  const messageChannelCardsFixtures: Record<
    MessageChannel,
    MessageChannelCardFixture
  > = {
    [MessageChannel.EMAIL]: {
      id: MessageChannel.EMAIL,
      title: "Email",
      icon: emailCardIconImage,
      onClick: () => navigate("/settings/email"),
      connected: isEmailConnected,
      additionalInfo: account?.emailProvider
        ? emailServiceToAdditionalInfoMap[
            account.emailProvider as EmailSendingService
          ]
        : undefined,
    },
    [MessageChannel.TWILIO]: {
      id: MessageChannel.TWILIO,
      title: "Twilio SMS",
      icon: twilioCardIconImage,
      onClick: () => navigate("/settings/sms"),
      connected: isTwilioConnected,
      additionalInfo: [{ key: "smsFrom", title: "SMS from" }],
    },
    [MessageChannel.CUSTOM_MODAL]: {
      id: MessageChannel.CUSTOM_MODAL,
      title: "Onboarding Suite",
      icon: customModalCardIconImage,
      connected: account?.javascriptSnippetSetupped,
      onClick: () => navigate("/settings/custom-modal"),
    },
    [MessageChannel.PUSH]: {
      id: MessageChannel.PUSH,
      title: "Push",
      icon: pushLogoIcon,
      onClick: () => navigate("/settings/push"),
    },
    [MessageChannel.SLACK]: {
      id: MessageChannel.SLACK,
      title: "Slack",
      icon: slackCardIconImage,
      commingSoon: true,
      disabled: true,
    },
  };

  const connectedFixtures = Object.values(messageChannelCardsFixtures).filter(
    (fixture) => fixture.connected && !fixture.disabled
  );

  const supportedFixtures = Object.values(messageChannelCardsFixtures).filter(
    (fixture) => !fixture.connected || fixture.disabled
  );

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.get<Account>({ url: "/accounts" });

        setAccount(data);
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="text-[#4B5563]">
        Browse the available channels in Laudspeaker, and set up the channels
        you want to use{" "}
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
              id={fixture.title.split(" ").join("-").toLowerCase()}
              onClick={fixture.onClick}
              className="p-5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col gap-[10px]"
            >
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-[10px]">
                  <div>
                    <img src={fixture.icon} />
                  </div>

                  <div className="text-[#18181B] font-inter text-base">
                    {fixture.title}
                  </div>

                  {fixture.beta && (
                    <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                      Beta
                    </div>
                  )}
                </div>

                <div>
                  <img src={arrowRightIconImage} />
                </div>
              </div>

              {fixture.additionalInfo && fixture.additionalInfo.length > 0 && (
                <>
                  <div className="h-[1px] w-full bg-[#E5E7EB]" />

                  <div className="flex w-full">
                    {fixture.additionalInfo.map((info, j) => (
                      <div key={j} className="w-full flex flex-col gap-[5px]">
                        <div className="w-fit font-inter text-[14px] text-[#4B5563]">
                          {info.title}
                        </div>
                        <div className="w-fit font-inter text-[14px] text-[#18181B]">
                          {String(account?.[info.key])}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
              id={fixture.title.split(" ").join("-").toLowerCase()}
              onClick={fixture.onClick}
              className={`p-5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex justify-between items-center ${
                fixture.disabled ? "select-none cursor-default grayscale" : ""
              }`}
            >
              <div className="flex items-center gap-[10px]">
                <div>
                  <img src={fixture.icon} />
                </div>

                <div className="text-[#18181B] font-inter text-base">
                  {fixture.title}
                </div>

                {fixture.beta && (
                  <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                    Beta
                  </div>
                )}

                {fixture.commingSoon && (
                  <div className="px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] font-normal leading-5 text-[#4B5563] border border-[#E5E7EB] bg-white">
                    comming soon
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
