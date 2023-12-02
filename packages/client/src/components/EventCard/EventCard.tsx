import React from "react";
import MinusIcon from "../../assets/images/MinusIcon.svg";
import { transformDataToUI } from "pages/Segment/SegmentHelpers";
import { FormDataItem } from "pages/Segment/MySegment";
import { Resource } from "pages/EmailBuilder/EmailBuilder";

export enum ConditionalType {
  and = "and",
  or = "or",
}

interface IEventCardProp {
  updateFormData: (args: {
    value: string;
    id: string;
    rowIndex: number;
    type: string;
    isRoot?: boolean;
  }) => void;
  formData: FormDataItem;
  id: number;
  resources: Record<string, Resource>;
  handleDeleteRow: (rowIndex: number) => void;
  rowLength: number;
  canDeleteRow: boolean;
  conditionType: ConditionalType;
}

const EventCard = (props: IEventCardProp) => {
  const {
    resources,
    id,
    formData,
    updateFormData,
    handleDeleteRow,
    canDeleteRow,
    conditionType,
  } = props;

  const deleteRow = (rowIndex: number) => {
    handleDeleteRow(rowIndex);
  };

  const handleChange = ({
    value,
    id: key,
    type,
    isRoot,
  }: {
    value: string;
    id: string;
    rowIndex?: number;
    type: string;
    isRoot?: boolean;
  }) => {
    updateFormData({
      value,
      id: key,
      rowIndex: id,
      type,
      isRoot,
    });
  };

  const generateFormData = (
    data: FormDataItem,
    optionsFilter = (item: { label: string }) => item.label !== undefined
  ) => {
    const formElements: React.ReactNode[] = [];
    const filteredOptions = (
      resources.conditions.options as { label: string }[]
    ).filter(optionsFilter);
    const resouresWithFilteredOptions = { ...resources };
    resouresWithFilteredOptions.conditions.options = filteredOptions;

    for (const key in data) {
      const objToPush = {
        data: resources[key],
        onChange: handleChange,
        isRoot: data[key]?.isRoot,
        value: data[key]?.value,
        id: key,
      };

      formElements.push(transformDataToUI(objToPush));
      if (data?.[key]?.children && Object.keys(data?.[key]?.children)?.length) {
        formElements.push(generateFormData(data?.[key]?.children));
      }
    }
    return formElements;
  };

  return (
    <div className="flex items-center relative">
      <div className="absolute left-[-72px] top-[40px] flex justify-center items-center z-[1111] w-[60px] h-[45px] bg-white border border-[#DEDEDE] rounded-3xl">
        {conditionType == ConditionalType.and ? "And" : "Or"}
      </div>
      <div className="rounded-[10px] mt-[10px] mx-[0px] pt-[0px] px-5 flex items-center cursor-pointer w-full bg-[#F9F9FA]">
        <div
          id="event-conditions"
          className="flex flex-[1] flex-wrap pt-[15px]"
        >
          {generateFormData(formData, (option) => option.label !== "Events")}
        </div>
        <div className="flex items-center justify-end w-[135px]">
          {canDeleteRow ? (
            <div className="flex">
              <button
                onClick={() => deleteRow(id)}
                style={{
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  padding: 0,
                  width: "24px",
                  height: "24px",
                }}
              >
                <img src={MinusIcon} width="24" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
