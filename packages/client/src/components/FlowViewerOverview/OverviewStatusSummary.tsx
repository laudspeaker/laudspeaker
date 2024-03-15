import { FC } from "react";
import { VictoryChart, VictoryArea } from "victory";

interface OverviewStatusSummaryProps {
  status: string;
  count: number;
  dataPoints: { x: number; y: number }[];
}

const OverviewStatusSummary: FC<OverviewStatusSummaryProps> = ({
  status,
  count,
  dataPoints,
}) => {
  const chartTheme = {
    axis: {
      style: {
        xLabels: {
          fill: "transparent",
        },
        grid: { stroke: "#F4F5F7", strokeWidth: 0 },
        axis: { stroke: "transparent" },
      },
    },
    chart: {
      padding: {
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
      },
    },
  };

  return (
    <div className="w-[260px] h-[219.5px] bg-white rounded-lg font-inter p-5 flex flex-col gap-2">
      <div className="font-normal text-sm text-[#4B5563]">{status}</div>
      <div className="text-3xl font-medium text-[#111827]">{count}</div>
      <VictoryChart theme={chartTheme} height={220}>
        <svg>
          <defs>
            <linearGradient
              id="myGradient"
              x1="100%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#E0E7FF00" />
            </linearGradient>
          </defs>
        </svg>
        <VictoryArea
          data={dataPoints}
          style={{
            data: {
              fill: "url(#myGradient)",
              stroke: "#6366F1",
              strokeWidth: "4px",
            },
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default OverviewStatusSummary;
