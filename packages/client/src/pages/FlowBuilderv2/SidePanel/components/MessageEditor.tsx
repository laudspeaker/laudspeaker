import Select from "components/Elements/Selectv2";
import {
  HitCondition,
  MessageCondition,
  TrackerCondition,
  WUAttributeCondition,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
  messageEventsCorelationWaitUntil,
  WaitUntilMessageProviderCorelation,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";
import { ConditionEditorError, errorToMessageMap } from "./ConditionEditor";

interface MessageEditorProps {
  errors?: {
    [ConditionEditorError.NO_JOURNEY_SPECIFiED]: string;
  };
  showErrors?: boolean;
  condition: MessageCondition;
  onChange: React.Dispatch<
    React.SetStateAction<
      HitCondition | TrackerCondition | MessageCondition | WUAttributeCondition
    >
  >;
}

const MessageEditor = ({
  condition,
  errors,
  showErrors,
  onChange,
}: MessageEditorProps) => {
  const [journeySearchQuery, setJourneySearchQuery] = useState("");
  const [journeySearchQueryPage, setJourneySearchQueryPage] = useState(1);
  const [journeySearchTotalPages, setJourneySearchTotalPages] = useState(1);
  const [availableJourneys, setAvailableJourneys] = useState<Workflow[]>([]);
  const [isJourneySearchLoading, setIsJourneySearchLoading] = useState(false);

  const [specMessageQuery, setSpecMessageQuery] = useState("");
  const [isSpecMessageQueryLoading, setIsSpecMessageQueryLoading] =
    useState(false);
  const [possibleMessages, setPossibleMessages] = useState<
    Record<string, { key: string; title: string }[]>
  >({});

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

  const loadPossibleJourneys = async () => {
    setIsJourneySearchLoading(true);
    try {
      const { data } = await ApiService.get<{
        data: Workflow[];
        totalPages: number;
      }>({
        url: `/journeys?take=12&skip=${
          (journeySearchQueryPage - 1) * 12
        }&search=${journeySearchQuery}&orderBy=latestSave&orderType=desc&filterStatuses=Active,Paused,Draft`,
      });

      setAvailableJourneys(
        journeySearchQueryPage === 1
          ? data.data
          : [...availableJourneys, ...data.data]
      );
      setJourneySearchTotalPages(data.totalPages);
    } catch (error) {
    } finally {
      setIsJourneySearchLoading(false);
    }
  };

  const searchableMessageInJourney = (channel: string, specId: string) => [
    {
      key: "ANY",
      title: `Any ${channel} in this journey`,
    },
    ...(possibleMessages[`${channel};;${specId}`] || []),
  ];

  useEffect(() => {
    if (!condition.from) return;

    loadAllMessages(
      WaitUntilMessageProviderCorelation[condition.providerType],
      condition.from.key
    );
  }, [condition.from]);

  useDebounce(
    () => {
      setJourneySearchQueryPage(1);
      loadPossibleJourneys();
    },
    500,
    [journeySearchQuery]
  );

  useEffect(() => {
    loadPossibleJourneys();
  }, [journeySearchQueryPage]);

  return (
    <>
      <Select
        value={condition.from?.key}
        searchPlaceholder="search journey"
        placeholder={condition.from?.title || "Select a journey"}
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
          if (selectedOptionI === undefined || !el) return;

          onChange({
            ...condition,
            from: {
              key: el,
              title: (availableJourneys?.map((availableJ) => ({
                key: availableJ.id,
                title: availableJ.name,
              })) || [])[selectedOptionI].title,
            },
          });
        }}
        noDataPlaceholder={"No results"}
        options={
          availableJourneys?.map((el) => ({
            key: el.id,
            title: el.name,
          })) || []
        }
      />
      {condition.from && (
        <Select
          value={condition.fromSpecificMessage.key}
          placeholder={condition.fromSpecificMessage.title}
          searchValue={specMessageQuery}
          isLoading={isSpecMessageQueryLoading}
          onSearchValueChange={setSpecMessageQuery}
          onChange={(el, selectedOptionI) => {
            if (selectedOptionI === undefined) return;

            onChange({
              ...condition,
              fromSpecificMessage: {
                key: el,
                title: searchableMessageInJourney(
                  WaitUntilMessageProviderCorelation[condition.providerType],
                  condition.from!.key
                ).filter((specMsg) =>
                  specMsg?.title?.includes(specMessageQuery)
                )[selectedOptionI].title,
              },
            });
          }}
          options={searchableMessageInJourney(
            WaitUntilMessageProviderCorelation[condition.providerType],
            condition.from.key
          ).filter((el) => el?.title?.includes(specMessageQuery))}
        />
      )}
      <div className="flex gap-[10px]">
        <Select
          value={condition.eventCondition}
          onChange={(el) => {
            onChange({
              ...condition,
              eventCondition: el,
            });
          }}
          options={messageEventsCorelationWaitUntil[condition.providerType]}
        />
      </div>
      {showErrors &&
        errors &&
        errors[ConditionEditorError.NO_JOURNEY_SPECIFiED] && (
          <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
            {errorToMessageMap[ConditionEditorError.NO_JOURNEY_SPECIFiED]}
          </div>
        )}
    </>
  );
};

export { MessageEditor };
