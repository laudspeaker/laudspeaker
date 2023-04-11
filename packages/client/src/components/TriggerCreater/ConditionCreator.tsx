import { Select } from "components/Elements";
import { getEventKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import DynamicField from "./DynamicField";
import { EventCondition, ProviderTypes } from "types/Workflow";
import Autocomplete from "components/Autocomplete";

export interface ConditionCreaterProps {
  condition: EventCondition;
  onChange: (condition: EventCondition) => void;
  possibleTypes: string[];
  isViewMode?: boolean;
  specificProvider: ProviderTypes;
}

interface PossibleKey {
  key: string;
  type: string;
  isArray: boolean;
  options: { label: string; id: string };
}

const ConditionCreater: FC<ConditionCreaterProps> = ({
  condition,
  onChange,
  possibleTypes,
  isViewMode,
  specificProvider,
}) => {
  const { key, value, type, comparisonType } = condition;

  const [possibleKeys, setPossibleKeys] = useState<PossibleKey[]>([]);
  const [possibleComparisonTypes, setPossibleComparisonTypes] = useState<
    {
      label: string;
      id: string;
    }[]
  >([]);
  const [dynamicDataToRender, setDynamicDataToRender] = useState<
    Record<string, string>
  >({});
  const [newKey, setNewKey] = useState(key || "");
  const [possibleValues, setPossibleValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState(value);

  const loadPossibleValues = async () => {
    if (key && value) {
      try {
        const { data } = await ApiService.get({
          url: `/events/possible-values/${key}?search=${value}`,
        });
        setPossibleValues(data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleConditionChange = (name: string, newValueToSet: string) => {
    condition[name as keyof EventCondition] = newValueToSet;
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
        } catch (e) {
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
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [comparisonType]);

  useEffect(() => {
    setNewKey(key || "");
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
    <div className="flex flex-col gap-[10px] m-[10px_0px]">
      <div className="relative">
        <Autocomplete
          inputId="keyInput"
          items={possibleKeys}
          inputValue={newKey}
          onInputChange={(event) => setNewKey(event.target.value || "")}
          label="Customer key:"
          disabled={isViewMode}
          onOptionSelect={(el) => {
            setNewKey(el.key);
            handleConditionChange("type", el.type);
            handleConditionChange("comparisonType", "");
            handleConditionChange("value", "");
          }}
          optionKey={(el) => el.key}
          optionRender={(el) => `${el.key} (${el.type})`}
        />
      </div>
      <Select
        label="Key type"
        id="keyType"
        options={possibleTypes.map((item) => ({ value: item }))}
        value={type || ""}
        onChange={(val) => {
          handleConditionChange("type", val);
          handleConditionChange("comparisonType", "");
          handleConditionChange("value", "");
        }}
        disabled={isViewMode}
        wrapperClassnames="max-w-[200px]"
      />
      <Select
        label="Condition"
        id="comparisonType"
        value={comparisonType || ""}
        options={possibleComparisonTypes.map((item) => ({
          value: item.id,
          title: item.label,
        }))}
        onChange={(val) => {
          handleConditionChange("comparisonType", val);
          handleConditionChange("value", "");
        }}
        disabled={isViewMode}
        wrapperClassnames="max-w-[200px]"
      />
      {dynamicDataToRender.type && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Value
          </label>
          <div className="flex items-center gap-[10px]">
            <DynamicField
              value={newValue}
              data={dynamicDataToRender}
              possibleValues={possibleValues}
              onChange={(val) => setNewValue(val)}
              disabled={isViewMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionCreater;
