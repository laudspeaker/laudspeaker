import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import React, { useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";

interface CustomModalField {
  name: string;
  type: StatementValueType;
  defaultValue: string;
}

interface CustomModalData {
  name: string;
  fields: CustomModalField[];
  events: string[];
}

const CustomModalBuilder = () => {
  const [customModalData, setCustomModalData] = useState<CustomModalData>({
    name: "",
    fields: [],
    events: [""],
  });

  const handleFieldAdd = () => {
    setCustomModalData({
      ...customModalData,
      fields: [
        ...customModalData.fields,
        { name: "", type: StatementValueType.STRING, defaultValue: "" },
      ],
    });
  };

  const handleFieldChange = (i: number, field: CustomModalField) => {
    const newCustomModalData = { ...customModalData };

    newCustomModalData.fields[i] = field;

    setCustomModalData(newCustomModalData);
  };

  const handleFieldDelete = (i: number) => {
    const newCustomModalData = { ...customModalData };

    newCustomModalData.fields.splice(i, 1);

    setCustomModalData(newCustomModalData);
  };

  const handleEventAdd = () => {
    setCustomModalData({
      ...customModalData,
      events: [...customModalData.events, ""],
    });
  };

  const handleEventChange = (i: number, event: string) => {
    const newCustomModalData = { ...customModalData };

    newCustomModalData.events[i] = event;

    setCustomModalData(newCustomModalData);
  };

  const handleEventDelete = (i: number) => {
    const newCustomModalData = { ...customModalData };

    newCustomModalData.events.splice(i, 1);

    setCustomModalData(newCustomModalData);
  };

  return (
    <div className="p-[20px]">
      <div>
        <span>Name:</span>
        <Input
          value={customModalData.name}
          onChange={(value) =>
            setCustomModalData({ ...customModalData, name: value })
          }
        />
      </div>

      <div>Data fields:</div>
      <div>
        {customModalData.fields.map((field, i) => (
          <div key={i} className="flex gap-[10px]">
            <Input
              value={field.name}
              onChange={(value) =>
                handleFieldChange(i, { ...field, name: value })
              }
            />
            <select
              value={field.type}
              onChange={(e) =>
                handleFieldChange(i, {
                  ...field,
                  type: e.target.value as StatementValueType,
                })
              }
              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
            >
              {Object.values(StatementValueType).map((type, j) => (
                <option key={j} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <FlowBuilderDynamicInput
              type={field.type}
              value={field.defaultValue}
              onChange={(value) =>
                handleFieldChange(i, {
                  ...field,
                  defaultValue: value,
                })
              }
            />

            <Button
              type={ButtonType.DANGEROUS}
              onClick={() => handleFieldDelete(i)}
            >
              Delete
            </Button>
          </div>
        ))}

        <div>
          <Button type={ButtonType.PRIMARY} onClick={handleFieldAdd}>
            Add
          </Button>
        </div>
      </div>
      <div>Events:</div>
      <div>
        {customModalData.events.map((event, i) => (
          <div key={i}>
            <Input
              value={event}
              onChange={(value) => {
                handleEventChange(i, value);

                if (i === customModalData.events.length - 1 && value)
                  handleEventAdd();
              }}
              onBlur={() => {
                if (i !== customModalData.events.length - 1 && event === "")
                  handleEventDelete(i);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomModalBuilder;
