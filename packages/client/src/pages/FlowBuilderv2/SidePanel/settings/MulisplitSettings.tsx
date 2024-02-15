import Button, { ButtonType } from "components/Elements/Buttonv2";
import {
  BranchType,
  MultisplitNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, Suspense, useEffect, useState } from "react";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import {
  ConditionalSegmentsSettings,
  Query,
} from "reducers/flow-builder.reducer";
import { v4 as uuid } from "uuid";
import MultisplitCondtionsReview from "../components/MultisplitCondtionsReview";
const FlowBuilderMultisplitModal = React.lazy(
  () => import("../../Modals/FlowBuilderMultisplitModal")
);

export const limitQuery = (
  query: Query,
  limit: number,
  count = 0
): [Query, number] => {
  if (!limit || count >= limit) {
    return [query, count];
  }

  const limitedQuery: Query = { ...query, statements: [] };
  for (const statement of query.statements) {
    if (count >= limit) {
      break;
    }
    if ((statement as Query)?.isSubBuilderChild) {
      const [limitedStatement, statementCount] = limitQuery(
        statement as Query,
        limit,
        count
      );
      limitedQuery.statements.push(limitedStatement);
      count += statementCount;
    } else {
      limitedQuery.statements.push(statement);
      count++;
    }
  }

  return [limitedQuery, count];
};

const MulisplitSettings: FC<
  SidePanelComponentProps<MultisplitNodeData> & { isViewMode?: boolean }
> = ({ nodeData, setNodeData, setIsError, showErrors, isViewMode }) => {
  const [editBranchIndex, setEditBranchIndex] = useState<number | undefined>(
    undefined
  );

  const handleSave = (branch: ConditionalSegmentsSettings) => {
    if (editBranchIndex === undefined) return;

    const newData = { ...nodeData };
    if (editBranchIndex === -1) {
      newData.branches.push({
        id: uuid(),
        type: BranchType.MULTISPLIT,
        conditions: branch,
      });
    } else {
      newData.branches[editBranchIndex].conditions = branch;
    }
    console.log("the segment data is", JSON.stringify(newData, null, 2));

    setNodeData(newData);
    setEditBranchIndex(undefined);
  };

  const handleDelete = (index: number) => {
    const newData = { ...nodeData };
    newData.branches.splice(index, 1);

    setNodeData(newData);
  };

  return (
    <>
      <div className="flex flex-col gap-[10px]">
        {nodeData.branches
          .filter((el) => el.conditions)
          .map((el, i) => {
            return (
              <React.Fragment key={el.id}>
                <div key={el.id} className="relative pb-[20px]">
                  <div className="w-full text-[#111827] text-[14px] font-inter font-semibold mb-[10px]">
                    Branch {i + 1}
                  </div>
                  <MultisplitCondtionsReview
                    condition={limitQuery(el.conditions!.query, 3)[0]}
                  />
                  {limitQuery(el.conditions!.query, 3)[1] >= 3 && (
                    <div
                      className="cursor-pointer select-none text-[#111827] mt-[10px] text-[14px] font-roboto w-full px-[15px] py-[4px] text-center border rounded border-[#E5E7EB]"
                      onClick={() => setEditBranchIndex(i)}
                    >
                      See all conditions
                    </div>
                  )}
                  {!isViewMode && (
                    <>
                      <div className="flex gap-[10px] mt-[10px]">
                        <Button
                          type={ButtonType.LINK}
                          onClick={() => setEditBranchIndex(i)}
                          className="!text-[#6366F1]"
                        >
                          Edit branch
                        </Button>
                        <Button
                          type={ButtonType.LINK}
                          onClick={() => {
                            handleDelete(i);
                          }}
                          className="!text-[#EB5757]"
                        >
                          Delete branch
                        </Button>
                      </div>
                      <div className="w-[calc(100%+20px)] absolute left-[-20px] z-10 bottom-[0px] border-[#E5E7EB] border-t-[1px]" />
                    </>
                  )}
                </div>
              </React.Fragment>
            );
          })}
      </div>
      {!isViewMode && (
        <div className="py-5 relative">
          <Button
            type={ButtonType.SECONDARY}
            onClick={() => {
              setEditBranchIndex(-1);
            }}
            className="!text-[#111827] !border-[#E5E7EB]"
          >
            Add branch
          </Button>
        </div>
      )}

      <Suspense fallback={<></>}>
        <FlowBuilderMultisplitModal
          isOpen={editBranchIndex !== undefined}
          branch={
            editBranchIndex === -1 || editBranchIndex === undefined
              ? undefined
              : nodeData.branches[editBranchIndex!].conditions
          }
          index={editBranchIndex}
          onSave={handleSave}
          onClose={() => setEditBranchIndex(undefined)}
          isViewMode={isViewMode}
        />
      </Suspense>
    </>
  );
};

export default MulisplitSettings;
