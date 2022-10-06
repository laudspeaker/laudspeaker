import React from "react";
import { Box } from "@mui/material";
import MinusIcon from "../../assets/images/MinusIcon.svg";
import { transformDataToUI } from "pages/Segment/SegmentHelpers";

export enum ConditionalType {
  and = "and",
  or = "or",
}

interface IEventCardProp {
  updateFormData: any;
  formData: any;
  id: any;
  resources: any;
  handleDeleteRow: any;
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

  const handleChange = ({ e, id: key, type, isRoot }: any) => {
    updateFormData({
      e,
      id: key,
      rowIndex: id,
      type,
      isRoot,
    });
  };

  const generateFormData = (
    data: any,
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
    <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          left: "-72px",
          top: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1111,
          width: "60px",
          background: "#FFFFFF",
          border: "1px solid #DEDEDE",
          borderRadius: "24px",
          height: "45px",
        }}
      >
        {conditionType == ConditionalType.and ? "And" : "Or"}
      </Box>
      <Box
        sx={{
          borderRadius: "10px",
          margin: "25px 0px",
          padding: "0 25px 20px",
          backgroundColor: "#F9F9FA",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Box display={"flex"} flex={1} flexWrap={"wrap"}>
          {generateFormData(formData, (option) => option.label !== "Events")}
        </Box>
        <Box display={"flex"} alignItems={"center"} sx={{ width: "135px" }}>
          {canDeleteRow ? (
            <Box display={"flex"}>
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
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

export default EventCard;
