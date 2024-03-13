import { DatePicker, Popover } from "antd";
import type { TimeRangePickerProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import BasicSelect from "components/BasicSelect";
import {
  OverviewLegend,
  OverviewStatusSummary,
  OverviewConversionChart,
  OverviewUserTable,
} from "components/FlowViewerOverview";
import { legendValues } from "utils/flowBuilderOverviewMockData";
import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import { useEffect, useMemo, useState } from "react";
import ApiService from "services/api.service";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

const { RangePicker } = DatePicker;

interface GetJourneyStatisticsDto {
  enrolledDataPoints: number[];
  finishedDataPoints: number[];
}

const FlowBuilderOverview = () => {
  const { id } = useParams();

  const dateFormat = "MMM D, YYYY";
  const date = new Date();
  const last30Days = date.setDate(date.getDate() - 30);

  const [frequency, setFrequency] = useState("daily");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs(last30Days),
    dayjs(new Date()),
  ]);
  const [enrolledDataPoints, setEnrolledDataPoints] = useState<number[]>([]);
  const [finishedDataPoints, setFinishedDataPoints] = useState<number[]>([]);

  const enrolledCount = useMemo(
    () => enrolledDataPoints.reduce((acc, el) => acc + el, 0),
    [enrolledDataPoints]
  );
  const finishedCount = useMemo(
    () => finishedDataPoints.reduce((acc, el) => acc + el, 0),
    [finishedDataPoints]
  );

  const loadData = async () => {
    try {
      const { data } = await ApiService.get<GetJourneyStatisticsDto>({
        url: `/journeys/${id}/statistics?startTime=${range?.[0]
          ?.toDate()
          .getTime()}&endTime=${range?.[1]
          ?.toDate()
          .getTime()}&frequency=${frequency}`,
      });

      setEnrolledDataPoints(data.enrolledDataPoints);
      setFinishedDataPoints(data.finishedDataPoints);
    } catch (e) {
      let message = "Unexpected error while loading statistics";

      if (e instanceof AxiosError) {
        message =
          e.response?.data?.message ||
          e.response?.data?.message?.[0] ||
          message;
      }

      toast.error(message);
    }
  };

  useEffect(() => {
    loadData();
  }, [range?.[0], range?.[1], frequency]);

  const rangePresets: TimeRangePickerProps["presets"] = [
    { label: "Last 30 Days", value: [dayjs().add(-30, "d"), dayjs()] },
    { label: "Last 90 Days", value: [dayjs().add(-90, "d"), dayjs()] },
  ];

  const popoverContent = () => (
    <div className="flex gap-2 items-center font-inter text-sm text-[#111827]">
      <span className="bg-[#F3F4F6] px-2 py-1 rounded-sm">Start session</span>
      within
      <span className="bg-[#F3F4F6] px-2 py-1 rounded-sm">1</span>
      <span className="bg-[#F3F4F6] px-2 py-1 rounded-sm">day</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <RangePicker
            value={range}
            format={dateFormat}
            needConfirm
            presets={rangePresets}
            onChange={setRange}
            className="rounded font-inter"
          />

          <BasicSelect
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
        </div>

        <Button type={ButtonType.SECONDARY} onClick={() => {}}>
          Export
        </Button>
      </div>

      <div className="flex gap-5 font-inter">
        <div className="flex flex-col gap-5">
          <OverviewStatusSummary
            status="Enrolled"
            count={enrolledCount}
            dataPoints={enrolledDataPoints.map((y, i) => ({ x: i, y }))}
          />

          <OverviewStatusSummary
            status="Finished"
            count={finishedCount}
            dataPoints={finishedDataPoints.map((y, i) => ({ x: i, y }))}
          />
        </div>

        <div className="bg-white rounded-lg p-5 flex flex-col gap-5 flex-1">
          <div className="flex gap-4 items-center">
            <span className="text-xl font-semibold">Conversion rate</span>
            <span className="text-sm font-normal text-[#4B5563]">
              Total 120K
            </span>
          </div>

          <div className="flex gap-16 justify-stretch">
            {/* {legendValues.map((value) => (
              <Popover
                key={value.title}
                content={popoverContent}
                title={
                  <span className="text-sm font-semibold">
                    Event {value.title}
                  </span>
                }
              >
                <button>
                  <OverviewLegend
                    title={`Conversion event ${value.title}`}
                    percentage={value.percentage}
                    conversionRate={value.conversionRate}
                    color={value.color}
                  />
                </button>
              </Popover>
            ))} */}
          </div>

          <OverviewConversionChart />
        </div>
      </div>

      <div className="bg-white rounded-lg font-inter p-5 flex flex-col gap-4">
        <div className="text-xl font-semibold">User</div>
        <OverviewUserTable />
      </div>
    </div>
  );
};

export default FlowBuilderOverview;
