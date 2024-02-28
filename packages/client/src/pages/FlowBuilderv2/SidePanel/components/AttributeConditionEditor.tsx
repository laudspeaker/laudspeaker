import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "components/AutoCompletev2/AutoCompletev2";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import {
  AttributeCondition,
  LogicRelation,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useId, useState } from "react";
import { useDebounce } from "react-use";
import {
  addSidePanelError,
  ComparisonType,
  removeSidePanelError,
  StatementValueType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { ConditionEditorError, errorToMessageMap } from "./ConditionEditor";
import { useDispatch } from "react-redux";
import { useAppSelector } from "store/hooks";

interface AttributeConditionEditorProps {
  condition: AttributeCondition;
  onCancel: () => void;
  onSave: (condition: AttributeCondition) => void;
}

const AttributeConditionEditor: FC<AttributeConditionEditorProps> = ({
  condition: initialCondition,
  onCancel,
  onSave,
}) => {
  const [condition, setCondition] = useState(initialCondition);
  const [keysQuery, setKeysQuery] = useState("");
  const { requireSaveEmit } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useDispatch();
  const id = useId();
  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
    }[]
  >([]);
  const [showErrors, setShowErrors] = useState(false);

  const errors: ConditionEditorError[][] = [];

  for (const statement of condition.statements) {
    const statementErrors: ConditionEditorError[] = [];

    if (!statement.value) {
      statementErrors.push(ConditionEditorError.NO_VALUE_SPECIFIED);
    }

    if (!statement.key) {
      statementErrors.push(ConditionEditorError.NO_PROPERTY_SPECIFIED);
    }

    errors.push(statementErrors);
  }

  useEffect(() => {
    const isError =
      errors.length > 0 ? errors.every((el) => !!el.length) : false;
    dispatch(isError ? addSidePanelError(id) : removeSidePanelError(id));
  }, [errors]);

  useEffect(() => {
    return () => {
      dispatch(removeSidePanelError(id));
    };
  }, []);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const loadPossibleKeys = async (query: string) => {
    const { data } = await ApiService.get<
      {
        key: string;
        type: StatementValueType;
        isArray: boolean;
      }[]
    >({
      url: `/customers/possible-attributes?key=${query}`,
    });

    setPossibleKeys(data);
  };

  const handleSave = () => {
    if (errors.some((statementErrors) => statementErrors.length > 0)) {
      setShowErrors(true);
      return;
    }
    onSave(condition);
  };

  useEffect(() => {
    if (requireSaveEmit) handleSave();
  }, [requireSaveEmit]);

  useDebounce(
    () => {
      loadPossibleKeys(keysQuery);
    },
    100,
    [keysQuery]
  );

  return (
    <div className="flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      {condition.statements.map((statement, i) => (
        <React.Fragment key={i}>
          <div className="flex justify-between items-center">
            <div className="font-inter font-semibold text-[14px] leading-[22px]">
              Attribute {i + 1}
            </div>
            <div
              className="cursor-pointer font-roboto font-normal text-[14px] leading-[22px] underline text-[#EB5757]"
              onClick={() => {
                condition.statements.splice(i);
                setCondition({ ...condition });
              }}
            >
              Delete
            </div>
          </div>
          <div>
            <FlowBuilderAutoComplete
              initialValue={statement.key}
              value={statement.key}
              includedItems={{
                type: "getter",
                items: possibleKeys.map((item) => item.key),
              }}
              retrieveLabel={(item) => item}
              onQueryChange={(query) => {
                condition.statements[i].key = query;
                setKeysQuery(query);
                setCondition({ ...condition });
              }}
              onSelect={(value) => {
                condition.statements[i].key = value;

                setKeysQuery(value);
                setCondition({ ...condition });
              }}
              getKey={(value) => value}
              placeholder="Property name"
            />

            {showErrors &&
              errors[i].some(
                (statementError) =>
                  statementError === ConditionEditorError.NO_PROPERTY_SPECIFIED
              ) && (
                <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
                  {
                    errorToMessageMap[
                      ConditionEditorError.NO_PROPERTY_SPECIFIED
                    ]
                  }
                </div>
              )}
          </div>
          <div className="flex gap-[10px]">
            <select
              value={statement.comparisonType}
              onChange={(e) => {
                condition.statements[i].comparisonType = e.target
                  .value as ComparisonType;
                setCondition({ ...condition });
              }}
              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
            >
              {valueTypeToComparisonTypesMap[statement.valueType].map(
                (comparisonType, j) => (
                  <option key={j} value={comparisonType}>
                    {comparisonType}
                  </option>
                )
              )}
            </select>
            <select
              value={statement.valueType}
              onChange={(e) => {
                condition.statements[i].valueType = e.target
                  .value as StatementValueType;
                setCondition({ ...condition });
              }}
              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
            >
              {Object.values(StatementValueType).map((valueType, j) => (
                <option key={j} value={valueType}>
                  {valueType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <DynamicInput
              type={statement.valueType}
              value={statement.value}
              onChange={(value) => {
                condition.statements[i].value = value;
                setCondition({ ...condition });
              }}
            />
            {showErrors &&
              errors[i].some(
                (statementError) =>
                  statementError === ConditionEditorError.NO_VALUE_SPECIFIED
              ) && (
                <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
                  {errorToMessageMap[ConditionEditorError.NO_VALUE_SPECIFIED]}
                </div>
              )}
          </div>
          {i !== condition.statements.length - 1 && (
            <select
              value={statement.relationToNext}
              onChange={(e) => {
                const newStatements = [...condition.statements];

                newStatements[i] = {
                  ...statement,
                  relationToNext: e.target.value as LogicRelation,
                };

                setCondition({
                  ...condition,
                  statements: newStatements.map((el) => ({
                    ...el,
                    relationToNext: e.target.value as LogicRelation,
                  })),
                });
              }}
              className="border border-[#E5E7EB] max-w-[80px] px-[15px] py-[4px] rounded font-roboto font-normal text-[14px] leading-[22px]"
            >
              <option value={LogicRelation.AND}>And</option>
              <option value={LogicRelation.OR}>Or</option>
            </select>
          )}
        </React.Fragment>
      ))}
      <div className="flex justify-between items-center">
        <div
          className="cursor-pointer font-inter text-[14px] leading-[22px] underline"
          onClick={() =>
            setCondition({
              ...condition,
              statements: [
                ...condition.statements,
                {
                  key: "",
                  comparisonType: ComparisonType.EQUALS,
                  value: "",
                  valueType: StatementValueType.STRING,
                  relationToNext: LogicRelation.AND,
                },
              ],
            })
          }
        >
          Add property
        </div>
        <div className="flex gap-[10px]">
          <Button type={ButtonType.SECONDARY} onClick={onCancel}>
            Cancel
          </Button>
          <Button type={ButtonType.PRIMARY} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttributeConditionEditor;
