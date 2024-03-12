import Select from "components/Elements/Selectv2";
import React, { useState } from "react";
import {
  ComparisonType,
  MessageEmailEventCondition,
  MessageEventQuery,
  MessageFromJourney,
  MessageGeneralComparison,
  MessageInAPPEventCondition,
  MessagePushEventCondition,
  MessageSMSEventCondition,
  Query,
  QueryStatement,
  QueryStatementType,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FilterBuilderDynamicInput from "../Elements/DynamicInput";

interface MessageStatementProps {
  statement: MessageEventQuery | Query;
  journeySearchQuery: string;
  isJourneySearchLoading: boolean;
  setJourneySearchQuery: React.Dispatch<React.SetStateAction<string>>;
  journeySearchQueryPage: number;
  journeySearchTotalPages: number;
  setJourneySearchQueryPage: (value: React.SetStateAction<number>) => void;
  handleChangeStatement: (i: number, _statement: QueryStatement) => void;
  index: number;
  availableTags: string[];
  availableJourneys: Workflow[];
}

const messageEventsCorelation: Record<
  | QueryStatementType.EMAIL
  | QueryStatementType.SMS
  | QueryStatementType.PUSH
  | QueryStatementType.IN_APP,
  {
    key:
      | MessageEmailEventCondition
      | MessageSMSEventCondition
      | MessagePushEventCondition
      | MessageInAPPEventCondition;
    title: string;
  }[]
> = {
  [QueryStatementType.EMAIL]: Object.values(MessageEmailEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
  [QueryStatementType.SMS]: [
    {
      key: MessageSMSEventCondition.RECEIVED,
      title: "been " + MessageSMSEventCondition.RECEIVED,
    },
    {
      key: MessageSMSEventCondition.CLICK_LINK,
      title: "been clicked sms link",
    },
  ],
  [QueryStatementType.PUSH]: Object.values(MessagePushEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
  [QueryStatementType.IN_APP]: Object.values(MessageInAPPEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
};

export const MessageStatement = ({
  statement,
  journeySearchQuery,
  isJourneySearchLoading,
  setJourneySearchQuery,
  journeySearchQueryPage,
  journeySearchTotalPages,
  setJourneySearchQueryPage,
  handleChangeStatement,
  index,
  availableTags,
  availableJourneys,
}: MessageStatementProps) => {
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [specMessageQuery, setSpecMessageQuery] = useState("");
  const [isSpecMessageQueryLoading, setIsSpecMessageQueryLoading] =
    useState(false);
  const [possibleMessages, setPossibleMessages] = useState<
    Record<string, { key: string; title: string }[]>
  >({});

  const searchableMessageInJourney = (channel: string, specId: string) => [
    {
      key: "ANY",
      title: `Any ${channel} in this journey`,
    },
    ...(possibleMessages[`${channel};;${specId}`] || []),
  ];

  const searchableJournys = [
    ...(!journeySearchQuery
      ? [
          {
            key: MessageFromJourney.ANY,
            title: "Any journeys",
          },
          {
            key: MessageFromJourney.WITH_TAG,
            title: "Journeys with a tag",
          },
        ]
      : []),
    ...(!availableJourneys?.length && journeySearchQuery
      ? []
      : [
          {
            key: "JourneysLabel",
            title: "Journeys",
            groupLabel: true,
          },
        ]),
    ...(!availableJourneys?.length && !journeySearchQuery
      ? [
          {
            key: "NoCreatedLabel",
            title: "No journey created",
            nonSelectable: true,
          },
        ]
      : availableJourneys?.map((el) => ({
          key: el.id,
          title: el.name,
        })) || []),
  ];

  const loadAllMessages = async (channel: string, specJourneyId: string) => {
    setIsSpecMessageQueryLoading(true);
    try {
      const { data } = await ApiService.get<
        {
          id: string;
          metadata: {
            channel: string;
            customName: string;
            destination: string;
            template: number;
          };
        }[]
      >({
        url: `/journeys/messages/${specJourneyId}/${channel}`,
      });
      setPossibleMessages((prev) => {
        prev[`${channel};;${specJourneyId}`] = data.map((el) => ({
          key: el.id,
          title: el.metadata.customName,
        }));

        return prev;
      });
    } catch (error) {
    } finally {
      setIsSpecMessageQueryLoading(false);
    }
  };

  return (
    <>
      <span className="font-inter text-[14px] leading-[22px] text-[#111827]">
        from
      </span>
      <Select
        value={(statement as MessageEventQuery).from.key}
        searchPlaceholder="search journey"
        placeholder={(statement as MessageEventQuery).from.title}
        searchValue={journeySearchQuery}
        isLoading={isJourneySearchLoading}
        onSearchValueChange={setJourneySearchQuery}
        onScrollToEnd={() => {
          if (
            isJourneySearchLoading ||
            journeySearchQueryPage >= journeySearchTotalPages
          )
            return;

          setJourneySearchQueryPage((prev) => prev + 1);
        }}
        onChange={(el, selectedOptionI) => {
          if (selectedOptionI === undefined) return;

          if (
            el !== MessageFromJourney.ANY &&
            el !== MessageFromJourney.WITH_TAG
          ) {
            loadAllMessages(
              (statement as MessageEventQuery).type.toLowerCase(),
              el
            );
          }

          handleChangeStatement(index, {
            ...statement,
            from: {
              key: el,
              title: searchableJournys[selectedOptionI].title,
            },
            fromSpecificMessage: {
              key: "ANY",
              title: "Any message",
            },
          } as MessageEventQuery);
        }}
        noDataPlaceholder={"No results"}
        className="min-w-[200px] max-w-[200px]"
        options={searchableJournys}
      />
      {(statement as MessageEventQuery).from.key ===
        MessageFromJourney.WITH_TAG && (
        <Select
          value={(statement as MessageEventQuery).tag}
          placeholder={(statement as MessageEventQuery).tag || "select a tag"}
          searchPlaceholder={"filter tag"}
          searchValue={tagSearchQuery}
          onSearchValueChange={setTagSearchQuery}
          onChange={(el) => {
            handleChangeStatement(index, {
              ...statement,
              tag: el,
            } as MessageEventQuery);
          }}
          noDataPlaceholder={"No results"}
          className="min-w-[200px] max-w-[200px]"
          options={availableTags
            .filter((el) =>
              el.toLowerCase().includes(tagSearchQuery.toLowerCase())
            )
            .map((el) => ({
              key: el,
              title: el,
            }))}
        />
      )}
      {(statement as MessageEventQuery).from.key !==
        MessageFromJourney.WITH_TAG &&
        (statement as MessageEventQuery).from.key !==
          MessageFromJourney.ANY && (
          <Select
            value={(statement as MessageEventQuery).fromSpecificMessage.key}
            placeholder={
              (statement as MessageEventQuery).fromSpecificMessage.title
            }
            searchValue={specMessageQuery}
            isLoading={isSpecMessageQueryLoading}
            onSearchValueChange={setSpecMessageQuery}
            onChange={(el, selectedOptionI) => {
              if (selectedOptionI === undefined) return;

              handleChangeStatement(index, {
                ...statement,
                fromSpecificMessage: {
                  key: el,
                  title: searchableMessageInJourney(
                    statement.type.toLowerCase(),
                    (statement as MessageEventQuery).from.key
                  ).filter((filterEl) =>
                    filterEl.title.includes(specMessageQuery)
                  )[selectedOptionI].title,
                },
              } as MessageEventQuery);
            }}
            noDataPlaceholder={"No results"}
            className="min-w-[140px] max-w-[140px]"
            options={searchableMessageInJourney(
              statement.type.toLowerCase(),
              (statement as MessageEventQuery).from.key
            ).filter((el) => (el.title || "").includes(specMessageQuery))}
          />
        )}
      <Select
        value={(statement as MessageEventQuery).happenCondition}
        onChange={(el) => {
          handleChangeStatement(index, {
            ...statement,
            happenCondition: el as MessageGeneralComparison,
          } as MessageEventQuery);
        }}
        noDataPlaceholder={"No results"}
        className="min-w-[80px] max-w-[110px]"
        options={[
          {
            key: MessageGeneralComparison.HAS,
            title: MessageGeneralComparison.HAS,
          },
          {
            key: MessageGeneralComparison.HAS_NOT,
            title: MessageGeneralComparison.HAS_NOT,
          },
        ]}
      />
      <Select
        value={(statement as MessageEventQuery).eventCondition}
        onChange={(el) => {
          handleChangeStatement(index, {
            ...statement,
            eventCondition: el,
          } as MessageEventQuery);
        }}
        noDataPlaceholder={"No results"}
        className="max-w-[160px]"
        options={messageEventsCorelation[(statement as MessageEventQuery).type]}
      />
      {(statement as MessageEventQuery).time === undefined && (
        <div className="min-w-full">
          <Button
            type={ButtonType.LINK}
            className="text-[#6366F1]"
            onClick={() =>
              handleChangeStatement(index, {
                ...statement,
                time: {
                  comparisonType: ComparisonType.BEFORE,
                  timeBefore: new Date().toISOString(),
                },
              } as MessageEventQuery)
            }
          >
            Set time
          </Button>
        </div>
      )}
      {(statement as MessageEventQuery).time !== undefined && (
        <div className="min-w-full flex items-center px-5 py-[14px] border border-[#E5E7EB] bg-white gap-[10px]">
          <Select
            value={(statement as MessageEventQuery).time!.comparisonType}
            options={[
              ComparisonType.BEFORE,
              ComparisonType.AFTER,
              ComparisonType.DURING,
            ].map((comparisonType) => ({
              key: comparisonType,
              title: comparisonType,
            }))}
            onChange={(e) =>
              handleChangeStatement(index, {
                ...statement,
                time: {
                  comparisonType: e as any,
                },
              } as MessageEventQuery)
            }
            className="max-w-[145px]"
          />

          <FilterBuilderDynamicInput
            type={StatementValueType.DATE}
            value={
              ((statement as MessageEventQuery).time?.comparisonType ===
              ComparisonType.BEFORE
                ? (statement as MessageEventQuery).time?.timeBefore
                : (statement as MessageEventQuery).time?.timeAfter) || ""
            }
            onChange={(value) => {
              handleChangeStatement(index, {
                ...statement,
                time: {
                  ...(statement as MessageEventQuery).time!,
                  ...((statement as MessageEventQuery).time?.comparisonType ===
                  ComparisonType.BEFORE
                    ? {
                        timeBefore: new Date(value).toISOString(),
                      }
                    : {
                        timeAfter: new Date(value).toISOString(),
                      }),
                },
              } as MessageEventQuery);
            }}
          />
          {(statement as MessageEventQuery).time?.comparisonType ===
            ComparisonType.DURING && (
            <>
              -
              <FilterBuilderDynamicInput
                type={StatementValueType.DATE}
                value={(statement as MessageEventQuery).time?.timeBefore || ""}
                onChange={(value) => {
                  handleChangeStatement(index, {
                    ...statement,
                    time: {
                      ...(statement as MessageEventQuery).time!,
                      timeBefore: new Date(value).toISOString(),
                    },
                  } as MessageEventQuery);
                }}
              />
            </>
          )}
          <div
            className="cursor-pointer ml-auto"
            onClick={() =>
              handleChangeStatement(index, {
                ...statement,
                time: undefined,
              } as MessageEventQuery)
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.28739 2.14118H5.14453C5.2231 2.14118 5.28739 2.0769 5.28739 1.99833V2.14118H10.716V1.99833C10.716 2.0769 10.7802 2.14118 10.8588 2.14118H10.716V3.4269H12.0017V1.99833C12.0017 1.36797 11.4892 0.855469 10.8588 0.855469H5.14453C4.51417 0.855469 4.00167 1.36797 4.00167 1.99833V3.4269H5.28739V2.14118ZM14.2874 3.4269H1.71596C1.39989 3.4269 1.14453 3.68225 1.14453 3.99833V4.56975C1.14453 4.64833 1.20882 4.71261 1.28739 4.71261H2.36596L2.80703 14.0519C2.8356 14.6608 3.33917 15.1412 3.9481 15.1412H12.0552C12.666 15.1412 13.1677 14.6626 13.1963 14.0519L13.6374 4.71261H14.716C14.7945 4.71261 14.8588 4.64833 14.8588 4.56975V3.99833C14.8588 3.68225 14.6035 3.4269 14.2874 3.4269ZM11.9177 13.8555H4.0856L3.65346 4.71261H12.3499L11.9177 13.8555Z"
                fill="#4B5563"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
};
