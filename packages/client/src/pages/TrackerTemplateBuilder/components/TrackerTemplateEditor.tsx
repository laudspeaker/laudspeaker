import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import React, { FC, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";
import { TrackerData, TrackerField } from "../TrackerTemplateBuilder";

interface TrackerTemplateEditorProps {
  trackerData: TrackerData;
  setTrackerData: (data: TrackerData) => void;
  setIsEditing: (value: boolean) => void;
}

const TrackerTemplateEditor: FC<TrackerTemplateEditorProps> = ({
  trackerData: initialTrackerData,
  setTrackerData: saveTrackerData,
  setIsEditing,
}) => {
  const [trackerData, setTrackerData] = useState(initialTrackerData);

  const handleFieldAdd = () => {
    setTrackerData({
      ...trackerData,
      fields: [
        ...trackerData.fields,
        { name: "", type: StatementValueType.STRING, defaultValue: "" },
      ],
    });
  };

  const handleFieldChange = (i: number, field: TrackerField) => {
    const newCustomModalData = { ...trackerData };

    newCustomModalData.fields[i] = field;

    setTrackerData(newCustomModalData);
  };

  const handleFieldDelete = (i: number) => {
    const newCustomModalData = { ...trackerData };

    newCustomModalData.fields.splice(i, 1);

    setTrackerData(newCustomModalData);
  };

  const handleEventAdd = () => {
    setTrackerData({
      ...trackerData,
      events: [...trackerData.events, ""],
    });
  };

  const handleEventChange = (i: number, event: string) => {
    const newCustomModalData = { ...trackerData };

    newCustomModalData.events[i] = event;

    setTrackerData(newCustomModalData);
  };

  const handleEventDelete = (i: number) => {
    const newCustomModalData = { ...trackerData };

    newCustomModalData.events.splice(i, 1);

    setTrackerData(newCustomModalData);
  };

  const handleSave = () => {
    saveTrackerData(trackerData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-[20px] bg-white rounded-[4px] flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[#18181B]">Template name</div>
        <Input
          value={trackerData.name}
          onChange={(value) => setTrackerData({ ...trackerData, name: value })}
          placeholder="name"
        />
      </div>

      <div className="w-full h-[1px] bg-[#E5E7EB]" />

      <div className="flex flex-col gap-[10px]">
        <div className="text-[16px] font-semibold leading-[24px]">Field</div>
        {trackerData.fields.map((field, i) => (
          <div
            key={i}
            className="flex justify-between items-center gap-[10px] p-[10px] bg-[#F3F4F6]"
          >
            <div className="flex gap-[10px]">
              <Input
                value={field.name}
                onChange={(value) =>
                  handleFieldChange(i, { ...field, name: value })
                }
                placeholder="field name"
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
            </div>

            <button onClick={() => handleFieldDelete(i)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M5.28544 2.14118H5.14258C5.22115 2.14118 5.28544 2.0769 5.28544 1.99833V2.14118H10.714V1.99833C10.714 2.0769 10.7783 2.14118 10.8569 2.14118H10.714V3.4269H11.9997V1.99833C11.9997 1.36797 11.4872 0.855469 10.8569 0.855469H5.14258C4.51222 0.855469 3.99972 1.36797 3.99972 1.99833V3.4269H5.28544V2.14118ZM14.2854 3.4269H1.71401C1.39794 3.4269 1.14258 3.68225 1.14258 3.99833V4.56975C1.14258 4.64833 1.20686 4.71261 1.28544 4.71261H2.36401L2.80508 14.0519C2.83365 14.6608 3.33722 15.1412 3.94615 15.1412H12.0533C12.664 15.1412 13.1658 14.6626 13.1944 14.0519L13.6354 4.71261H14.714C14.7926 4.71261 14.8569 4.64833 14.8569 4.56975V3.99833C14.8569 3.68225 14.6015 3.4269 14.2854 3.4269ZM11.9158 13.8555H4.08365L3.65151 4.71261H12.3479L11.9158 13.8555Z"
                  fill="#4B5563"
                />
              </svg>
            </button>
          </div>
        ))}

        <div className="w-fit">
          <Button type={ButtonType.SECONDARY} onClick={handleFieldAdd}>
            Add field
          </Button>
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#E5E7EB]" />

      <div className="flex flex-col gap-[10px]">
        <div className="text-[16px] font-semibold leading-[24px]">Event</div>
        {trackerData.events.map((event, i) => (
          <div className="flex justify-between gap-[16px] items-center" key={i}>
            <Input
              wrapperClassName="!w-full"
              className="w-full"
              value={event}
              onChange={(value) => handleEventChange(i, value)}
              placeholder="Event"
            />

            <button onClick={() => handleEventDelete(i)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M5.28544 2.14118H5.14258C5.22115 2.14118 5.28544 2.0769 5.28544 1.99833V2.14118H10.714V1.99833C10.714 2.0769 10.7783 2.14118 10.8569 2.14118H10.714V3.4269H11.9997V1.99833C11.9997 1.36797 11.4872 0.855469 10.8569 0.855469H5.14258C4.51222 0.855469 3.99972 1.36797 3.99972 1.99833V3.4269H5.28544V2.14118ZM14.2854 3.4269H1.71401C1.39794 3.4269 1.14258 3.68225 1.14258 3.99833V4.56975C1.14258 4.64833 1.20686 4.71261 1.28544 4.71261H2.36401L2.80508 14.0519C2.83365 14.6608 3.33722 15.1412 3.94615 15.1412H12.0533C12.664 15.1412 13.1658 14.6626 13.1944 14.0519L13.6354 4.71261H14.714C14.7926 4.71261 14.8569 4.64833 14.8569 4.56975V3.99833C14.8569 3.68225 14.6015 3.4269 14.2854 3.4269ZM11.9158 13.8555H4.08365L3.65151 4.71261H12.3479L11.9158 13.8555Z"
                  fill="#4B5563"
                />
              </svg>
            </button>
          </div>
        ))}

        <div className="w-fit">
          <Button type={ButtonType.SECONDARY} onClick={handleEventAdd}>
            Add event
          </Button>
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#E5E7EB]" />

      <div className="flex gap-[10px]">
        <Button type={ButtonType.PRIMARY} onClick={handleSave}>
          Save
        </Button>

        <Button type={ButtonType.SECONDARY} onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default TrackerTemplateEditor;
