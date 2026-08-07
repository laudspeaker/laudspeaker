import { format } from "date-fns";
import React, { ReactNode, useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "store/hooks";
import journeyBuilderImage from "./svg/journey-builder.svg";
import messageChannelsImage from "./svg/message-channels.svg";
import eventProviderImage from "./svg/event-provider.svg";
import userSchemaImage from "./svg/user-schema.svg";
import { useNavigate } from "react-router-dom";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { AppConfig } from "../../constants";
import config, { JOURNEY_ONBOARDING_KEY } from "config";
import ApiService from "services/api.service";
import Account from "types/Account";
import {
  setOnboarded,
  setMessageSetupped,
  setEventProviderSetupped,
  setUserSchemaSetupped,
} from "reducers/onboarding.reducer";

interface CustomEvent {
  event: string;
  source: string;
  correlationKey: string;
  correlationValue: string;
  payload: string;
  createdAt: string;
  errorMessage?: string;
}

const Homev2 = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [account, setAccount] = useState<Account>();

  const { firstName } = useAppSelector((state) => state.auth.userData);
  const {
    onboarded,
    messageSetupped,
    eventProviderSetupped,
    userSchemaSetupped,
  } = useAppSelector((state) => state.onboarding);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const { data } = await ApiService.get<Account>({ url: "/accounts" });
        setAccount(data);

        const {
          mailgunConnections,
          sendgridConnections,
          resendConnections,
          twilioConnections,
          pushConnections,
          pushPlatforms,
          pk,
        } = data.workspace;

        // Check if any of the connection arrays are not empty
        const messageSetuppedCondition =
          [
            mailgunConnections,
            sendgridConnections,
            resendConnections,
            twilioConnections,
            pushConnections,
          ].some((arr) => arr && arr.length > 0) ||
          Object.keys(pushPlatforms).length > 0;

        // Dispatch the actions based on conditions
        if (messageSetuppedCondition) {
          dispatch(setMessageSetupped(true));
        }

        // Check for user schema setup (primary key set)
        if (pk && pk.name) {
          dispatch(setUserSchemaSetupped(true));
        }

        const { data: customEventsData } = await ApiService.get({
          url: `/events/custom-events?take=${itemsPerPage}`,
        });
        const eventsCondition = customEventsData.data.length > 0;

        /*
        // Check if any of the connection arrays are not empty
        const eventsCondition = [customEventsData].some(
          (arr) => arr && arr.length > 0
        );
        */

        if (eventsCondition) {
          dispatch(setEventProviderSetupped(true));
        }

        // Dispatch actions to update the Redux store based on the API response
        //dispatch(setOnboarded(data.workspace.onboarded));
        //dispatch(setEventProviderSetupped(data.workspace.eventProviderSetupped));
      } catch (error) {
        console.error("Error fetching account data:", error);
      }
    };

    fetchAccountData();
  }, [dispatch]);

  const onboardingFixtures: {
    title: string;
    description: string | ReactNode;
    link: string;
    linkText: string;
    image: string;
    doneLinkText: string;
    done: boolean;
  }[] = [
    {
      title: "Set up your user schema",
      description: (
        <>
          Define the list of user properties that Laudspeaker should track to
          create segments, and personalize messages.{" "}
          <strong>
            You must show Laudspeaker how to identify users by setting the
            primary key
          </strong>{" "}
          before you can send messages to any users, or receive events.
        </>
      ),
      image: userSchemaImage,
      link: "/people/setting",
      linkText: "Setup now",
      doneLinkText: "Revisit setup",
      done: userSchemaSetupped,
    },
    {
      title: "Add message channels",
      description: (
        <>
          Seamlessly connect your push, SMS, and email platforms to reach your
          customers on their preferred channels.{" "}
          <strong>
            Head to the Message Channels tab of Settings, and add the channels
            you want.
          </strong>{" "}
          Checkout our documentation for more support:
          https://laudspeaker.com/docs/getting-started/setting-up-mobile-push
        </>
      ),
      image: messageChannelsImage,
      link: "/settings",
      linkText: "Setup now",
      doneLinkText: "Revisit setup",
      done: messageSetupped,
    },
    {
      title: "Send events to Laudspeaker",
      description: (
        <>
          We'll guide you through how to send events to Laudspeaker to trigger
          messages at the right time.{" "}
          <strong>
            Head to the API tab of Settings, and copy the snippet, then check
            out the Event Tracker page
          </strong>{" "}
          When you fire the events, they should appear on that page.
        </>
      ),
      image: eventProviderImage,
      link: "/settings",
      linkText: "Setup now",
      doneLinkText: "Revisit setup",
      done: eventProviderSetupped,
    },
    {
      title: "Create your first journey!",
      description:
        "Create your first journey with guided tutorials. Unleash your creativity and engage your audience with customized journeys.",
      image: journeyBuilderImage,
      link: "/flow",
      linkText: "Start",
      doneLinkText: "Restart",
      done: onboarded,
    },
  ];

  const activeFixture = onboardingFixtures.find((fixture) => !fixture.done);

  const activeFixtureIndex = activeFixture
    ? onboardingFixtures.indexOf(activeFixture)
    : -1;

  return (
    <div className="bg-[#F3F4F6] p-[40px] flex flex-col gap-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex gap-4 items-end">
        <div className="text-[30px] font-roboto font-medium leading-[40px]">
          Hi, {firstName}
        </div>
        <div>{format(new Date(), "MM/dd/yyyy")}</div>
      </div>

      {
        <div className="flex justify-between gap-5">
          <div className="flex flex-col gap-5 w-full">
            <div className="p-5 rounded-lg flex flex-col bg-white">
              <div className="font-inter text-[20px] font-semibold leading-[28px]">
                Setup guide
              </div>
              {onboardingFixtures.map((fixture, i) => (
                <div
                  className={`flex justify-between gap-[10px] rounded-lg px-[10px] ${
                    i === activeFixtureIndex || fixture.done
                      ? "bg-[#F3F4F6] border border-[#E5E7EB] py-5 mt-[20px]"
                      : "py-[10px]"
                  }`}
                  key={i}
                >
                  <div className="flex gap-[10px]">
                    <div>
                      {fixture.done ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2.25 12C2.25 6.615 6.615 2.25 12 2.25C17.385 2.25 21.75 6.615 21.75 12C21.75 17.385 17.385 21.75 12 21.75C6.615 21.75 2.25 17.385 2.25 12ZM15.61 10.186C15.67 10.1061 15.7134 10.0149 15.7377 9.91795C15.762 9.82098 15.7666 9.72014 15.7514 9.62135C15.7361 9.52257 15.7012 9.42782 15.6489 9.3427C15.5965 9.25757 15.5276 9.18378 15.4463 9.12565C15.3649 9.06753 15.2728 9.02624 15.1753 9.00423C15.0778 8.98221 14.9769 8.97991 14.8785 8.99746C14.7801 9.01501 14.6862 9.05205 14.6023 9.10641C14.5184 9.16077 14.4462 9.23135 14.39 9.314L11.154 13.844L9.53 12.22C9.38783 12.0875 9.19978 12.0154 9.00548 12.0188C8.81118 12.0223 8.62579 12.101 8.48838 12.2384C8.35097 12.3758 8.27225 12.5612 8.26882 12.7555C8.2654 12.9498 8.33752 13.1378 8.47 13.28L10.72 15.53C10.797 15.6069 10.8898 15.6662 10.992 15.7036C11.0942 15.7411 11.2033 15.7559 11.3118 15.7469C11.4202 15.738 11.5255 15.7055 11.6201 15.6519C11.7148 15.5982 11.7967 15.5245 11.86 15.436L15.61 10.186Z"
                            fill="#22C55E"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="11.75"
                            cy="11.75"
                            r="9.25"
                            stroke="#111827"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col gap-[10px]">
                      <div
                        className={`font-inter text-base font-normal ${
                          i === activeFixtureIndex || fixture.done
                            ? "font-semibold"
                            : ""
                        }`}
                      >
                        {fixture.title}
                      </div>

                      {(i === activeFixtureIndex || fixture.done) && (
                        <>
                          <div className="font-inter text-[14px] font-normal leading-[22px]">
                            {fixture.description}
                          </div>

                          <div className="w-fit">
                            <Button
                              type={
                                fixture.done
                                  ? ButtonType.SECONDARY
                                  : ButtonType.PRIMARY
                              }
                              className={`!px-5 !py-[10px] !leading-5 !font-semibold !font-inter !text-[14px] !rounded-lg ${
                                fixture.done ? "!bg-[#F3F4F6]" : ""
                              }`}
                              onClick={() => navigate(fixture.link)}
                            >
                              {fixture.done
                                ? fixture.doneLinkText
                                : fixture.linkText}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {(i === activeFixtureIndex || fixture.done) && (
                      <img src={fixture.image} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* <div className="min-w-[360px] w-[360px]">3</div> */}
        </div>
      }
    </div>
  );
};

export default Homev2;
