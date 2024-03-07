import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import Dot from "components/Dot";

const data = [
  {
    name: "Oct 1",
    a: 0,
    b: 10,
    c: 20,
    d: 33,
    e: 40,
    percentage: 10,
  },
  {
    name: "Oct 6",
    a: 12,
    b: 18,
    c: 40,
    d: 62,
    e: 91,
    percentage: 40,
  },
  {
    name: "Oct 12",
    a: 8,
    b: 0,
    c: 15,
    d: 24,
    e: 36,
    percentage: 50,
  },
  {
    name: "Oct 18",
    a: 55,
    b: 32,
    c: 26,
    d: 44,
    e: 77,
    percentage: 60,
  },
  {
    name: "Oct 24",
    a: 77,
    b: 66,
    c: 70,
    d: 62,
    e: 62,
    percentage: 85,
  },
  {
    name: "Oct 30",
    a: 10,
    b: 12,
    c: 12,
    d: 14,
    e: 0,
    percentage: 100,
  },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-sm p-3 flex flex-col gap-2 font-inter relative">
        <p className="text-xs">{`${label}`}</p>
        {payload.map((event) => (
          <div
            key={event.dataKey}
            className="font-semibold text-sm text-[#111827] flex gap-5 items-center"
          >
            <div className="flex gap-1 items-center">
              <Dot color={`${event.stroke}` || "#000"} width={6} height={6} />
              <span>Event {(event.dataKey as string).toUpperCase()}</span>
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

const OverviewConversionChart = () => {
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
          top: 15,
          right: 0,
          left: -15,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="0" vertical={false} />
        <XAxis dataKey="name" axisLine={false} />
        <YAxis unit="%" axisLine={false} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: "5 5", stroke: "#4B5563" }}
        />
        <Line dataKey="a" stroke="#6366F1" strokeWidth={1.8} dot={false} />
        <Line dataKey="b" stroke="#0EA5E3" strokeWidth={1.8} dot={false} />
        <Line dataKey="c" stroke="#EAB308" strokeWidth={1.8} dot={false} />
        <Line dataKey="d" stroke="#22C55E" strokeWidth={1.8} dot={false} />
        <Line dataKey="e" stroke="#111827" strokeWidth={1.8} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default OverviewConversionChart;
