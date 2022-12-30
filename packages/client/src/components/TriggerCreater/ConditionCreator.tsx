import { Input, Select } from "components/Elements";
import { getEventKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useEffect, useState } from "react";
import AC from "react-autocomplete";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import DynamicField from "./DynamicField";
import MinusIcon from "../../assets/images/MinusIcon.svg";
import { EventCondition, ProviderTypes } from "types/triggers";

export interface ConditionCreaterProps {
  condition: EventCondition;
  onChange: (condition: EventCondition) => void;
  onDelete: () => void;
  possibleTypes: string[];
  isViewMode?: boolean;
  specificProvider: ProviderTypes;
}

const ConditionCreater: FC<ConditionCreaterProps> = ({
  condition,
  onChange,
  onDelete,
  possibleTypes,
  isViewMode,
  specificProvider,
}) => {
  const { key, value, type, comparisonType } = condition;

  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: string;
      isArray: boolean;
      options: { label: string; id: string };
    }[]
  >([]);
  const [possibleComparisonTypes, setPossibleComparisonTypes] = useState<
    {
      label: string;
      id: string;
    }[]
  >([]);
  const [dynamicDataToRender, setDynamicDataToRender] = useState({});
  const [newKey, setNewKey] = useState(key);
  const [possibleValues, setPossibleValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState(value);

  const loadPossibleValues = async () => {
    if (key && value) {
      try {
        const { data } = await ApiService.get({
          url: `/events/possible-values/${key}?search=${value}`,
        });
        setPossibleValues(data);
      } catch (e: any) {
        console.error(e);
      }
    }
  };

  const handleConditionChange = (name: string, newValueToSet: string) => {
    (condition as any)[name] = newValueToSet;
    onChange(condition);
  };

  useEffect(() => {
    (async () => {
      if (type) {
        try {
          const { data } = await ApiService.get({
            url: `/events/possible-comparison/${type}`,
          });

          setPossibleComparisonTypes(data);
        } catch (e: any) {
          console.error(e);
        }
      }
    })();
  }, [type]);

  useEffect(() => {
    (async () => {
      if (comparisonType) {
        try {
          const { data } = await ApiService.get({
            url: `/events/attributes/${comparisonType}`,
          });

          setDynamicDataToRender(data);
        } catch (e: any) {
          console.error(e);
        }
      }
    })();
  }, [comparisonType]);

  useEffect(() => {
    setNewKey(key);
  }, [key]);

  useEffect(() => {
    setNewValue(value);
  }, [value]);

  useEffect(() => {
    getEventKeys("")
      .then(({ data }) => {
        setPossibleKeys(data);
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  useDebounce(
    () => {
      handleConditionChange("key", newKey || "");
      getEventKeys(newKey || "", specificProvider)
        .then(({ data }) => {
          setPossibleKeys(data);
        })
        .catch((err) => {
          console.error(err);
        });
    },
    1000,
    [newKey, specificProvider]
  );

  useDebounce(
    () => {
      handleConditionChange("value", newValue || "");
      loadPossibleValues();
    },
    1000,
    [newValue, key]
  );

  return (
    <div className="grid grid-cols-4 gap-[10px] items-center m-[10px_0px]">
      <div className="relative">
        <AC
          getItemValue={(item) => JSON.stringify(item)}
          items={possibleKeys}
          autoHighlight={false}
          renderInput={(props) => (
            <Input
              name={props.name || ""}
              value={props.value}
              onChange={props.onChange}
              inputRef={props.ref}
              aria-expanded={props["aria-expanded"]}
              disabled={isViewMode}
              id="keyInput"
              {...props}
            />
          )}
          renderItem={(item, isHighlighted) => (
            <div
              className={`${
                isHighlighted ? "bg-cyan-100" : ""
              } p-[2px] rounded-[6px] relative max-w-full break-all`}
            >
              {item.key} ({item.type})
            </div>
          )}
          renderMenu={(items) => {
            if (!items.length) return <></>;

            return (
              <div className="max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                {items}
              </div>
            );
          }}
          value={newKey}
          onChange={(e) => {
            setNewKey(e.target.value);
          }}
          onSelect={(e) => {
            const val = JSON.parse(e);
            setNewKey(val.key);
            handleConditionChange("type", val.type);
            handleConditionChange("comparisonType", "");
            handleConditionChange("value", "");
          }}
        />
      </div>
      <Select
        id="keyType"
        options={possibleTypes.map((item) => ({ value: item }))}
        value={type}
        onChange={(val) => {
          handleConditionChange("type", val);
          handleConditionChange("comparisonType", "");
          handleConditionChange("value", "");
        }}
        disabled={isViewMode}
      />
      <Select
        id="comparisonType"
        value={comparisonType}
        options={possibleComparisonTypes.map((item) => ({
          value: item.id,
          title: item.label,
        }))}
        onChange={(val) => {
          handleConditionChange("comparisonType", val);
          handleConditionChange("value", "");
        }}
        disabled={isViewMode}
      />
      <div className="flex gap-[10px]">
        <DynamicField
          value={newValue}
          data={dynamicDataToRender}
          possibleValues={possibleValues}
          onChange={(val) => setNewValue(val)}
          disabled={isViewMode}
        />
        {!isViewMode && <img onClick={onDelete} src={MinusIcon} />}
      </div>
    </div>
  );
};

export default ConditionCreater;
