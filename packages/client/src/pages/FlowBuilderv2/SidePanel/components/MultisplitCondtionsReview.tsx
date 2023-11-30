import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  ComparisonType,
  MessageEventQuery,
  ObjectKeyComparisonType,
  Query,
  QueryStatementType,
  QueryType,
  StatementValueType,
} from "reducers/flow-builder.reducer";

interface MultisplitCondtionsReviewProps {
  condition: Query;
}

const MultisplitCondtionsReview = ({
  condition,
}: MultisplitCondtionsReviewProps) => {
  return (
    <>
      {condition.statements.map((statement, i) => (
        <React.Fragment key={i}>
          <div
            className={`w-full text-[#111827] text-[14px] p-[10px] rounded ${
              (statement as Query)?.isSubBuilderChild
                ? "border border-[#E5E7EB]"
                : "bg-[#F3F4F6]"
            }`}
          >
            {statement.type !== QueryType.ALL &&
              statement.type !== QueryType.ANY && (
                <div className="text-[#111827] font-inter text-[14px] leading-[22px] font-semibold w-full mb-[10px]">
                  {statement.type}
                </div>
              )}

            {statement.type === QueryStatementType.ATTRIBUTE ? (
              <div className="items-center flex flex-wrap gap-[5px]">
                <span className="max-w-[90px] inline-block overflow-hidden text-ellipsis whitespace-nowrap text-[14px] px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.key}
                </span>
                <span> {statement.comparisonType} </span>
                {statement.comparisonType !== ComparisonType.EXIST &&
                  statement.comparisonType !== ComparisonType.NOT_EXIST && (
                    <span className="max-w-[90px] overflow-hidden text-ellipsis px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                      {statement.valueType === StatementValueType.DATE
                        ? format(new Date(statement.value), "MM/dd/yyyy HH:mm")
                        : statement.value}
                    </span>
                  )}

                {statement.valueType === StatementValueType.DATE &&
                  statement.comparisonType === ComparisonType.DURING && (
                    <>
                      <div>-</div>
                      <div className="px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
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
                    <div className="px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                      {statement.subComparisonValue}
                    </div>
                  )}
              </div>
            ) : statement.type === QueryStatementType.SEGMENT ? (
              <div className="px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                {statement.segmentId}
              </div>
            ) : statement.type === QueryStatementType.EVENT ? (
              <div className="items-center flex flex-wrap gap-[5px]">
                <div className="max-w-[90px] inline-block overflow-hidden text-ellipsis px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.eventName}
                </div>
                <div>{statement.comparisonType} at least</div>
                <div className="max-w-[90px] inline-block overflow-hidden text-ellipsis  px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                  {statement.value}
                </div>
                <div>time</div>
                {statement.time && (
                  <div className="min-w-full gap-[10px] flex items-center">
                    <div>{statement.time.comparisonType}</div>

                    {statement.time.timeAfter && (
                      <div className="px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                        {format(
                          new Date(statement.time.timeAfter),
                          "MM/dd/yyyy HH:mm"
                        )}
                      </div>
                    )}
                    {statement.time.comparisonType ===
                      ComparisonType.DURING && <div>-</div>}
                    {((statement.time.timeBefore && statement.time.timeAfter) ||
                      statement.time.timeBefore) && (
                      <>
                        <div className="px-[5px] py-[2px] text-[#4B5563] border border-[#E5E7EB] rounded-sm bg-white">
                          {format(
                            new Date(statement.time.timeBefore),
                            "MM/dd/yyyy HH:mm"
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : [
                QueryStatementType.EMAIL,
                QueryStatementType.InAPP,
                QueryStatementType.PUSH,
                QueryStatementType.SMS,
              ].includes(statement.type as QueryStatementType) ? (
              <>
                <div className="text-[14px] mt-[-10px]">
                  {(statement as MessageEventQuery).time && (
                    <div className="min-w-full gap-[4px] flex items-center">
                      <div>
                        {(statement as MessageEventQuery).time?.comparisonType}
                      </div>

                      {(statement as MessageEventQuery)?.time?.timeAfter &&
                        format(
                          new Date(
                            (statement as MessageEventQuery).time!.timeAfter!
                          ),
                          "MM/dd/yyyy"
                        )}
                      {(statement as MessageEventQuery).time?.comparisonType ===
                        ComparisonType.DURING && <div>to</div>}
                      {(((statement as MessageEventQuery).time?.timeBefore &&
                        (statement as MessageEventQuery).time?.timeAfter) ||
                        (statement as MessageEventQuery).time?.timeBefore) &&
                        format(
                          new Date(
                            (statement as MessageEventQuery).time!.timeBefore!
                          ),
                          "MM/dd/yyyy"
                        )}
                    </div>
                  )}
                </div>
                <div className="text-[14px] leading-[22px]">
                  {(statement as MessageEventQuery).fromSpecificMessage.key ===
                  "ANY" ? (
                    <span className="font-bold text-[#111827]">
                      Any {statement.type.toLowerCase()}
                    </span>
                  ) : (
                    <span className=" px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                      {
                        (statement as MessageEventQuery).fromSpecificMessage
                          .title
                      }
                    </span>
                  )}
                  <span> from </span>
                  {(statement as MessageEventQuery).from?.key ? (
                    <span className="px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                      {(statement as MessageEventQuery).from?.title}
                    </span>
                  ) : (
                    <span className="font-bold text-[#EB5757]">
                      Select journey
                    </span>
                  )}
                </div>
                <div className="text-[14px] leading-[22px] font-inter">
                  {(statement as MessageEventQuery).happenCondition} been{" "}
                  {(statement as MessageEventQuery).eventCondition}
                </div>
              </>
            ) : (statement as Query)?.isSubBuilderChild ? (
              <MultisplitCondtionsReview condition={statement as Query} />
            ) : (
              <></>
            )}
          </div>
          {i !== condition.statements.length - 1 && (
            <div
              className={`${
                condition.type === QueryType.ALL
                  ? "text-[#0C4A6E] bg-[#E0F2FE]"
                  : "text-[#713F12] bg-[#FEF9C3]"
              } my-[10px] max-w-[50px] z-[1] text-center mr-[10px] py-[2px] px-[11.5px] rounded-[14px] font-roboto font-normal text-[14px] leading-[22px]`}
            >
              {condition.type === QueryType.ALL ? "AND" : "OR"}
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default MultisplitCondtionsReview;
