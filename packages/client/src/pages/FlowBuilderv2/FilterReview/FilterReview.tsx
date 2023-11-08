import { format } from "date-fns";
import {
  ComparisonType,
  ObjectKeyComparisonType,
  Query,
  QueryStatementType,
  QueryType,
  StatementValueType,
} from "reducers/flow-builder.reducer";

interface FlowBuilderReviewProps {
  settingsQuery: Query;
}

const FilterReview = ({ settingsQuery }: FlowBuilderReviewProps) => {
  return (
    <>
      <div className="flex gap-[13px]">
        <div className="flex flex-col gap-[10px] w-full">
          {settingsQuery.statements.map((statement, i) => (
            <div className="flex items-center gap-[13px]">
              {i !== 0 && (
                <div
                  className={`w-fit px-[12px] py-[5px] border-[1px] border-[#E5E7EB] font-roboto text-[14px] leading-[22px] text-[#4B5563] select-none`}
                >
                  {settingsQuery.type === QueryType.ALL ? "And" : "Or"}
                </div>
              )}

              <div
                key={i}
                className="max-w-[600px] w-full flex flex-wrap items-center gap-[10px] font-inter font-normal text-[14px] leading-[22px] bg-[#F3F4F6] px-[20px] py-[6px]"
              >
                <div>{statement.type}</div>
                {statement.type === QueryStatementType.ATTRIBUTE ? (
                  <>
                    <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                      {statement.key}
                    </div>
                    <div>{statement.comparisonType}</div>
                    {statement.comparisonType !== ComparisonType.EXIST &&
                      statement.comparisonType !== ComparisonType.NOT_EXIST && (
                        <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                          {statement.valueType === StatementValueType.DATE
                            ? format(
                                new Date(statement.value),
                                "MM/dd/yyyy HH:mm"
                              )
                            : statement.value}
                        </div>
                      )}

                    {statement.valueType === StatementValueType.DATE &&
                      statement.comparisonType === ComparisonType.DURING && (
                        <>
                          <div>-</div>
                          <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                            {format(
                              new Date(statement.subComparisonValue),
                              "MM/dd/yyyy HH:mm"
                            )}
                          </div>
                        </>
                      )}

                    {statement.comparisonType === ComparisonType.OBJECT_KEY && (
                      <div>{statement.subComparisonType}</div>
                    )}

                    {statement.comparisonType === ComparisonType.OBJECT_KEY &&
                      (statement.subComparisonType ===
                        ObjectKeyComparisonType.KEY_VALUE_EQUAL_TO ||
                        statement.subComparisonType ===
                          ObjectKeyComparisonType.KEY_VALUE_NOT_EQUAL_TO) && (
                        <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                          {statement.subComparisonValue}
                        </div>
                      )}
                  </>
                ) : statement.type === QueryStatementType.SEGMENT ? (
                  <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                    {statement.segmentId}
                  </div>
                ) : statement.type === QueryStatementType.EVENT ? (
                  <>
                    <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                      {statement.eventName}
                    </div>
                    <div>{statement.comparisonType} at least</div>
                    <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                      {statement.value}
                    </div>
                    <div>time</div>
                    {/* TODO: ADD REVIEW FOR EVENTS */}
                    {statement.time && (
                      <div className="min-w-full gap-[10px] flex items-center">
                        <div>{statement.time.comparisonType}</div>

                        {statement.time.timeAfter && (
                          <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                            {format(
                              new Date(statement.time.timeAfter),
                              "MM/dd/yyyy HH:mm"
                            )}
                          </div>
                        )}
                        {statement.time.comparisonType ===
                          ComparisonType.DURING && <div>-</div>}
                        {((statement.time.timeBefore &&
                          statement.time.timeAfter) ||
                          statement.time.timeBefore) && (
                          <>
                            <div className="px-[12px] py-[5px] text-[#4B5563] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                              {format(
                                new Date(statement.time.timeBefore),
                                "MM/dd/yyyy HH:mm"
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (statement as Query)?.isSubBuilderChild ? (
                  <FilterReview settingsQuery={statement as Query} />
                ) : (
                  <></>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FilterReview;
