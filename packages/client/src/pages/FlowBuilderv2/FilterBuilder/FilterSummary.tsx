import {
  ConditionalSegmentsSettings,
  QueryType,
} from "reducers/flow-builder.reducer";
import { SegmentsSettings } from "reducers/segment.reducer";

interface FilterSummaryProps {
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  sizeLoading: Record<string, boolean>;
  i: number;
  sizeData: Record<
    string,
    {
      size: number;
      total: number;
    }
  >;
}

export const FilterSummary = ({
  settings,
  sizeLoading,
  i,
  sizeData,
}: FilterSummaryProps) => {
  const isLoading =
    settings?.query?.type === QueryType.ALL
      ? !!sizeLoading[i]
      : !!sizeLoading[0];

  const data =
    settings?.query?.type === QueryType.ALL ? sizeData[i] : sizeData[0];

  const percentage = data ? Math.ceil((data.size / data.total) * 100) : 0;

  return !data && !isLoading ? (
    <></>
  ) : (
    <div
      className={`${
        isLoading && "opacity-70 animate-pulse pointer-events-none"
      } relative flex items-center py-[8.45px] max-w-[360px] px-[11.45px] rounded bg-[#F3F4F6]`}
    >
      <div
        className="mr-[2px] min-w-[15px] min-h-[15px] border border-[#6366F1] rounded-full"
        style={{
          background: `
                  conic-gradient(
                    #6366F1 ${percentage}%,
                    white ${percentage}% 100%
                  )
                `,
        }}
      />
      {isLoading ? (
        <span className="ml-[6px] text-[#4B5563] font-roboto text-[14px] leading-[22px]">
          Loading...
        </span>
      ) : (
        data && (
          <>
            <span className="text-[#6366F1] font-roboto font-semibold text-[14px] leading-[22px]">
              {percentage}%
            </span>
            <span className="ml-[6px] text-[#4B5563] font-roboto text-[14px] leading-[22px]">
              of users estimated reached ≈{" "}
              {Intl.NumberFormat("en", {
                notation: "compact",
              }).format(data.size)}
            </span>
          </>
        )
      )}
      <div className="absolute top-full left-[25px] z-[0] h-[10px] w-[1px] bg-[#E5E7EB]" />
    </div>
  );
};
