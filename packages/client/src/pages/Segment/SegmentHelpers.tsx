/* eslint-disable react/jsx-filename-extension */
import { FormControl } from "@mui/material";
import DateRangePicker from "components/DateRangePicker";
import DateTimePicker from "components/Elements/DateTimePicker";
import { Resource } from "pages/EmailBuilder/EmailBuilder";
import { SegmentType } from "pages/SegmentTable/NameSegment";
import { Select, Input } from "../../components/Elements";
import { ApiConfig } from "../../constants";
import ApiService from "../../services/api.service";
import { InclusionCriteria, IResource } from "./MySegment";

export const getConditions = async () => {
  return new Promise<Resource>((resolve) => {
    resolve({
      id: "conditions",
      type: "select",
      label: "filter on",
      options: [
        { label: "select", id: "", isPlaceholder: true },
        { label: "Events", id: "events" },
        { label: "Attributes", id: "attributes" },
      ],
    });
  });
};

export const getFilterConditions = async () => {
  return new Promise<Resource>((resolve) => {
    resolve({
      id: "conditions",
      type: "select",
      label: "",
      options: [
        { label: "filter on", id: "filteron" },
        { label: "member of", id: "memberof" },
        // { label: "Events", id: "events" },
        // { label: "select", id: "", isPlaceholder: true },
        // { label: "Attributes", id: "attributes" },
      ],
    });
  });
};

export const getResources = async (id: string) => {
  return ApiService.get({
    url: `${ApiConfig.resources}/${id}`,
  });
};

export const getEventResources = async (id: string) => {
  return ApiService.get<Resource>({
    url: `${ApiConfig.eventResources}/${id}`,
  });
};

export const getEventKeys = async (id: string, provider = "") => {
  return ApiService.get({
    url: `${ApiConfig.eventAttributes}/${id}?provider=${provider}`,
  });
};

export const getCustomerKeys = async (
  key: string,
  type?: string | null,
  isArray?: boolean | null
) => {
  const { data } = await ApiService.get({
    url: `${ApiConfig.customersAttributes}?key=${key}${
      type ? `&type=${type}` : ""
    }${isArray ? `&isArray=${isArray}` : ""}`,
  });
  return data;
};

export const getSegment = async (id: string) => {
  return ApiService.get({
    url: `${ApiConfig.segments}/${id}`,
  });
};

interface ISegmentMutationData {
  name: string;
  inclusionCriteria: InclusionCriteria;
  resources: IResource;
}

export const createSegment = async (
  data: ISegmentMutationData & { type: SegmentType }
) => {
  return ApiService.post({
    url: ApiConfig.segments,
    options: {
      ...data,
    },
  });
};

export const updateSegment = async (id: string, data: ISegmentMutationData) => {
  return ApiService.patch({
    url: `${ApiConfig.segments}/${id}`,
    options: {
      ...data,
    },
  });
};

export const duplicateSegment = async (id: string) => {
  return ApiService.post({
    url: `${ApiConfig.segments}/${id}/duplicate`,
    options: {},
  });
};

interface ITransformToUI {
  data: Resource;
  onChange: (data: {
    value: any;
    id: string;
    rowIndex?: number;
    type: string;
    isRoot?: boolean;
  }) => void;
  value?: string | [Date, Date];
  id?: string;
  isRoot?: boolean;
  disabled?: boolean;
  width?: string;
  placeholderText?: string;
}

export const transformDataToUI = ({
  data,
  onChange,
  value,
  id = "id",
  isRoot = false,
  disabled = false,
  width = "40px",
  placeholderText = "",
}: ITransformToUI) => {
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
            value={value as string}
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
          value={value as string}
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
          value={(value as string) || "1"}
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
          value={(value as [Date, Date]) || [new Date(), new Date()]}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              value: e,
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
          value={(value as string) || new Date().toUTCString()}
          handleChange={(v) =>
            onChange({
              value: new Date(v).toUTCString(),
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
