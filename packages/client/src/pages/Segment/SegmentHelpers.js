/* eslint-disable react/jsx-filename-extension */
import { FormControl } from "@mui/material";
import DateRangePicker from "components/DateRangePicker";
import DateTimePicker from "components/Elements/DateTimePicker";
import { Select, Input } from "../../components/Elements";
import { ApiConfig } from "../../constants";
import ApiService from "../../services/api.service";

export const getConditions = async () => {
  return new Promise((resolve) => {
    resolve({
      id: "conditions",
      type: "select",
      options: [
        { label: "Add Condition Or Group", id: -1, isPlaceholder: true },
        { label: "Events", id: "events" },
        { label: "Attributes", id: "attributes" },
      ],
    });
  });
};

export const getResources = async (id) => {
  return ApiService.get({
    url: `${ApiConfig.resources}/${id}`,
  });
};

export const getSegment = async (id) => {
  return ApiService.get({
    url: `${ApiConfig.audiences}/${id}`,
  });
};

export const updateSegment = async (id, data) => {
  return ApiService.patch({
    url: `${ApiConfig.audiences}`,
    options: {
      ...data,
    },
  });
};

export const transformDataToUI = ({
  data = {},
  onChange,
  value,
  id = "id",
  isRoot,
  disabled = false,
  width = "40px",
  placeholderText = "",
}) => {
  const { type } = data;
  let jsx = null;
  switch (type) {
    case "select": {
      if (data?.options?.length) {
        const placeholder = data.options.find(
          (item) => item.isPlaceholder
        )?.label;
        jsx = (
          <Select
            value={value}
            options={data.options.map((item) => {
              if (item.isPlaceholder) return { value: "", title: placeholder };
              return { value: `${item.id}`, title: item.label };
            })}
            name={id}
            displayEmpty
            disabled={disabled}
            customButtonClass={`${
              disabled && "!bg-gray-200 !cursor-auto opacity-[0.7]"
            }`}
            onChange={(v) => onChange({ value: v, id, type: "select", isRoot })}
            sx={{
              height: "44px",
              "& .MuiSelect-select": {
                padding: "9px 15px",
                border: "1px solid #DEDEDE",
                paddingRight: "50px !important",
                boxShadow: "none",
              },
            }}
          />
        );
      }
      break;
    }
    case "inputText": {
      jsx = (
        <Input
          isRequired
          label=""
          value={value}
          placeholder={placeholderText}
          name={id}
          id={id}
          disabled={disabled}
          fullWidth
          onChange={(e) =>
            onChange({ value: e.target.value, id, type: "inputText" })
          }
          labelShrink
          inputProps={{
            style: {
              height: "24px",
              borderRadius: "24px",
              border: "1px solid #DEDEDE",
              padding: "10px 20px",
              background: "#FFF",
              width: { width },
              textAlign: "center",
              fontSize: "16px",
            },
          }}
          sx={{
            height: "44px",
            borderRadius: "24px",
            width: "auto",
          }}
        />
      );
      break;
    }
    case "inputNumber": {
      jsx = (
        <Input
          isRequired
          label=""
          value={value || "1"}
          placeholder={""}
          name={id}
          id={id}
          fullWidth
          min={data?.range?.min}
          max={data?.range?.max}
          onChange={(e) =>
            onChange({ value: e.target.value, id, type: "inputNumber" })
          }
          disabled={disabled}
          labelShrink
          type={"number"}
          inputProps={{
            min: data?.range?.min,
            max: data?.range?.max,
            steps: 1,
            style: {
              height: "24px",
              borderRadius: "24px",
              border: "1px solid #DEDEDE",
              padding: "10px 20px",
              background: "#FFF",
              width: "40px",
              textAlign: "center",
              fontSize: "16px",
            },
          }}
          sx={{
            height: "44px",
            borderRadius: "24px",
            width: "auto",
          }}
        />
      );
      break;
    }
    case "dateRange": {
      jsx = (
        <DateRangePicker
          value={value || [new Date(), new Date()]}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              value: e.target.value,
              id,
              type: "dateRange",
            })
          }
        />
      );
      break;
    }
    case "dateTime": {
      jsx = (
        <DateTimePicker
          value={new Date(value) || new Date()}
          handleChange={(v) =>
            onChange({
              value: v.toUTCString(),
              id,
              type: "dateTime",
            })
          }
          disabled={disabled}
          sx={{
            background: "#fff",
            borderRadius: "22px",
            "& .MuiOutlinedInput-root": { borderRadius: "22px" },
          }}
          inputStyle={{
            style: {
              height: "24px",
              padding: "10px",
              fontSize: "16px",
              background: "#fff",
              borderRadius: "22px",
            },
          }}
        />
      );
      break;
    }

    default:
      break;
  }

  return (
    <FormControl
      sx={{
        padding: "0 15px",
        margin: "20px 0",
        width: "auto",
      }}
    >
      {data?.label ? (
        <div className="flex items-center">
          <p style={{ marginRight: "15px" }}>{data?.label}</p>
          {jsx}
        </div>
      ) : (
        <>{jsx}</>
      )}
    </FormControl>
  );
};
