import { FC, PureComponent } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Legend,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import Dot from "components/Dot";

interface OverviewConversionChartProps {
  data: Record<string, any>[];
  lines: Record<string, any>[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-sm p-3 flex flex-col gap-2 font-inter relative">
        {payload.map((event) => (
          <div
            key={event.name}
            className="font-semibold text-sm text-[#111827] flex gap-5 items-center"
          >
            <div className="flex gap-1 items-center">
              <Dot color={`${event.color}` || "#000"} width={6} height={6} />
              <span>{event.name as string}</span>
            </div>
            <span>{event.value}%</span>
          </div>
        ))}
        <div className="bg-transparent border-y-[6px] border-r-[8px] border-y-transparent border-r-white absolute top-16 -left-2" />
      </div>
    );
  }

  return null;
};

const CustomizedAxisTick = (props: any) => {
  const { index, x, y, payload } = props;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
};

const OverviewConversionChart: FC<OverviewConversionChartProps> = ({
  data,
  lines,
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        width={500}
        height={300}
        data={data}
        style={{
          fontSize: "14px",
          color: "#4B5563",
          fontFamily: "inter",
          fontWeight: 400,
        }}
        margin={{
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="label"
          interval={0}
          tick={CustomizedAxisTick}
          height={70}
          padding={{ left: 30, right: 30 }}
        />
        <YAxis unit="%" axisLine={false} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: "5 5", stroke: "#4B5563" }}
        />
        <Legend verticalAlign="top" height={36} />
        {lines.map((line) => {
          return (
            <Line
              key={line.event}
              dataKey={`data.${line.event}`}
              name={line.event}
              stroke={line.color}
              fill={line.color}
              strokeWidth={1.8}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default OverviewConversionChart;
