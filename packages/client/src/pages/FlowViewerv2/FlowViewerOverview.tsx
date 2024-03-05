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

const { RangePicker } = DatePicker;

const FlowBuilderOverview = () => {
  const dateFormat = "MMM D, YYYY";
  const date = new Date();
  const last30Days = date.setDate(date.getDate() - 30);

  const onRangeChange = (
    dates: null | (Dayjs | null)[],
    dateStrings: string[]
  ) => {
    if (dates) {
      console.log("From: ", dates[0], ", to: ", dates[1]);
      console.log("From: ", dateStrings[0], ", to: ", dateStrings[1]);
    } else {
      console.log("Clear");
    }
  };

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
    <div className="py-5 pl-5 flex flex-col gap-4">
      <div className="flex gap-2">
        <RangePicker
          defaultValue={[dayjs(last30Days), dayjs(new Date())]}
          format={dateFormat}
          needConfirm
          presets={rangePresets}
          onChange={onRangeChange}
          className="rounded font-inter"
        />

        <BasicSelect
          defaultValue="daily"
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
          ]}
        />
      </div>

      <div className="flex gap-5 font-inter">
        <div className="flex flex-col gap-5">
          <OverviewStatusSummary
            status="Enrolled"
            count={200}
            dataPoints={[
              { x: 0, y: 0 },
              { x: 0.5, y: 1.5 },
              { x: 2, y: 2 },
              { x: 3, y: 1.5 },
              { x: 4, y: 2 },
              { x: 5, y: 1 },
            ]}
          />

          <OverviewStatusSummary
            status="Finished"
            count={100}
            dataPoints={[
              { x: 0, y: 0 },
              { x: 0.5, y: 1.5 },
              { x: 2, y: 2 },
              { x: 3, y: 1.5 },
              { x: 4, y: 2 },
              { x: 5, y: 1 },
            ]}
          />
        </div>

        <div className="bg-white rounded-lg p-5 flex flex-col gap-5">
          <div className="flex gap-4 items-center">
            <span className="text-xl font-semibold">Conversion rate</span>
            <span className="text-sm font-normal text-[#4B5563]">
              Total 120K
            </span>
          </div>

          <div className="flex gap-4 justify-stretch">
            {legendValues.map((value) => (
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
            ))}
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
