import { format } from "date-fns";
import { capitalize } from "lodash";
import { FC } from "react";
import {
  ComparisonType,
  DateComparisonType,
  ObjectKeyComparisonType,
  Query,
  QueryStatementType,
  QueryType,
  StatementValueType,
} from "reducers/flow-builder.reducer";

interface FilterViewerProps {
  settingsQuery: Query;
  inversedBackround?: boolean;
}

const FilterViewer: FC<FilterViewerProps> = ({
  settingsQuery,
  inversedBackround,
}) => {
  return (
    <div
      className={`flex flex-col gap-2 font-inter text-[14px] font-normal leading-[22px] w-full ${
        inversedBackround ? "bg-[#F3F4F6]" : "bg-white"
      }`}
    >
      <div className="flex gap-2.5 items-center">
        <div className="flex justify-center items-center w-[50px] px-3 py-[5px] bg-[#F3F4F6] rounded-sm border-[1px] border-[#E5E7EB] text-[#4B5563]">
          {capitalize(settingsQuery.type)}
        </div>
        <div>of the following conditions match</div>
      </div>
      {settingsQuery.statements.map((statement, i) => (
        <div className="flex gap-2.5 items-center w-full" key={i}>
          <div
            className={`flex justify-center items-center w-[50px] px-2.5 py-[2px] rounded-[14px] text-[12px] font-semibold leading-[20px] ${
              settingsQuery.type === QueryType.ALL
                ? "bg-[#E0F2FE] text-[#0C4A6E]"
                : "bg-[#FEF9C3] text-[#713F12]"
            }`}
          >
            {settingsQuery.type === QueryType.ALL ? "AND" : "OR"}
          </div>
          <div
            className={`w-full p-2.5 rounded flex gap-2.5 items-center ${
              inversedBackround ? "bg-white" : "bg-[#F3F4F6]"
            }`}
          >
            {statement.type === QueryStatementType.ATTRIBUTE ? (
              <>
                <div>Attribute</div>
                <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.key}
                </div>
                <div>{statement.comparisonType}</div>
                {statement.comparisonType !== ComparisonType.EXIST &&
                  statement.comparisonType !== ComparisonType.NOT_EXIST && (
                    <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                      {statement.valueType === StatementValueType.DATE &&
                      statement.dateComparisonType ===
                        DateComparisonType.ABSOLUTE
                        ? format(new Date(statement.value), "MM/dd/yyyy HH:mm")
                        : statement.value}
                    </div>
                  )}

                {statement.valueType === StatementValueType.DATE &&
                  statement.comparisonType === ComparisonType.DURING && (
                    <>
                      <div>-</div>
                      <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                        {statement.dateComparisonType ===
                        DateComparisonType.ABSOLUTE
                          ? format(
                              new Date(statement.subComparisonValue),
                              "MM/dd/yyyy HH:mm"
                            )
                          : statement.subComparisonValue}
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
                    <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                      {statement.subComparisonValue}
                    </div>
                  )}
              </>
            ) : statement.type === QueryStatementType.SEGMENT ? (
              <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                {statement.segmentId}
              </div>
            ) : statement.type === QueryStatementType.EVENT ? (
              <>
                <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.eventName}
                </div>
                <div>{statement.comparisonType} at least</div>
                <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.value}
                </div>
                <div>time</div>
                {/* TODO: ADD REVIEW FOR EVENTS */}
                {statement.time && (
                  <div className="min-w-full gap-[10px] flex items-center">
                    <div>{statement.time.comparisonType}</div>

                    {statement.time.timeAfter && (
                      <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                        {statement.time.dateComparisonType ===
                        DateComparisonType.ABSOLUTE
                          ? format(
                              new Date(statement.time.timeAfter),
                              "MM/dd/yyyy HH:mm"
                            )
                          : statement.time.timeAfter}
                      </div>
                    )}
                    {statement.time.comparisonType ===
                      ComparisonType.DURING && (
                      <>
                        {((statement.time.timeBefore &&
                          statement.time.timeAfter) ||
                          statement.time.timeBefore) && (
                          <>
                            <div>-</div>
                            <div className="px-[12px] py-[5px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                              {statement.time.dateComparisonType ===
                              DateComparisonType.ABSOLUTE
                                ? format(
                                    new Date(statement.time.timeBefore),
                                    "MM/dd/yyyy HH:mm"
                                  )
                                : statement.time.timeBefore}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (statement as Query)?.isSubBuilderChild ? (
              <FilterViewer
                settingsQuery={statement as Query}
                inversedBackround={!inversedBackround}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterViewer;
