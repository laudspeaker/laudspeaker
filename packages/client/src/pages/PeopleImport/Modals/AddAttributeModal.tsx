import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import DateFormatPicker from "../DateFormatPicker";
import {
  AttributeParameter,
  AttributeType,
} from "pages/PeopleSettings/PeopleSettings";

interface FormatData {
  key: string;
  title: string;
  example: string;
}

const dateFormats: FormatData[] = [
  { key: "dd MMM yyyy", title: "DD MMM yyyy", example: "15 Jan 1990" },
  { key: "dd MMM yy", title: "DD MMM yy", example: "15 Jan 90" },
  { key: "dd-MM-yy", title: "DD MM yy", example: "15-01-90" },
  { key: "dd-MM-yyyy", title: "DD MM yyyy", example: "15-01-1990" },
  { key: "dd-M-yy", title: "DD M yy", example: "15-1-90" },
  { key: "dd-M-yyyy", title: "DD M yyyy", example: "15-1-1990" },
  { key: "M-dd-yy", title: "M DD yy", example: "1-15-90" },
  { key: "M-dd-yyyy", title: "M DD yyyy", example: "1-15-1990" },
  { key: "MM-dd-yy", title: "MM DD yy", example: "01-15-90" },
  { key: "MM-dd-yyyy", title: "MM DD yyyy", example: "01-15-1990" },
  { key: "MMM dd yyyy", title: "MMM DD yyyy", example: "Jan 15 1990" },
  { key: "MMM dd yy", title: "MMM DD yy", example: "Jan 15 90" },
  { key: "MMMM dd yyyy", title: "Month DD yyyy", example: "January 15 1990" },
  { key: "MMMM dd yy", title: "Month DD yy", example: "January 15 90" },
  { key: "yyyy-M-dd", title: "yyyy M DD", example: "1990-1-15" },
  { key: "yyyy-MM-dd", title: "yyyy MM DD", example: "1990-01-15" },
  {
    key: "EEE, MMM dd, yyyy",
    title: "ddd MMM DD yyyy",
    example: "Mon, Jan 15, 1990",
  },
];

const dateTimeFormats: FormatData[] = [
  {
    key: "yyyy-MM-dd HH:mm",
    title: "yyyyMMDD HHmm",
    example: "1990-01-15 10:10",
  },
  {
    key: "MM-dd-yyyy HH:mm",
    title: "MMDDyyyy HHmm",
    example: "01-15-1990 10:10",
  },
  {
    key: "dd-MM-yyyy HH:mm",
    title: "DDMMyyyy HHmm",
    example: "15-01-1990 10:10",
  },
  { key: "MM-dd-yy HH:mm", title: "MMDDyy HHmm", example: "01-15-90 10:10" },
  { key: "dd-MM-yy HH:mm", title: "DDMMyy HHmm", example: "15-01-90 10:10" },
  {
    key: "MM-dd-yyyy hh:mm aaaa",
    title: "MMDDyyyy HHmm xm",
    example: "01-15-1990 10:10 pm",
  },
  {
    key: "dd-MM-yyyy hh:mm aaaa",
    title: "DDMMyyyy HHmm xm",
    example: "15-01-1990 10:10 am",
  },
  {
    key: "MM-dd-yy hh:mm:ss aaaa",
    title: "MMDDyy HHmmss xm",
    example: "01-15-90 10:10:10 am",
  },
  {
    key: "yyyy-MM-dd'T'HH:mm",
    title: "yyyyMMDDTHHmm",
    example: "1990-01-15T10:10",
  },
  {
    key: "yyyy-MM-dd'T'HH:mmxxx",
    title: "yyyyMMDDTHHmmoffset",
    example: "1990-01-15T10:10+09:30",
  },
  {
    key: "yyyy-MM-dd'T'HH:mm:ssxxx",
    title: "ISO 8601",
    example: "1990-01-15T00:34:59+09:30",
  },
  {
    key: "yyyy-MM-dd'T'HH:mm:ss",
    title: "ISO 8601 without timezone offset",
    example: "1990-01-15T00:34:59",
  },
  { key: "T", title: "Unix timestamp", example: "1670874565" },
  {
    key: "ddd MMM DD HHmmss yyyy",
    title: "ddd MMM DD HHmmss yyyy",
    example: "Wed, Jan 15, 00:34:60, 1990",
  },
];

interface AddAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (
    keyName: string,
    keyType: AttributeType,
    dateFormat?: string
  ) => void;
}

const AddAttributeModal = ({
  isOpen,
  onClose,
  onAdded,
}: AddAttributeModalProps) => {
  const [newName, setNewName] = useState("");
  const [selectedType, setSelectedType] = useState<AttributeType>();
  const [dateFormat, setDateFormat] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [possibleAttributeTypes, setPossibleAttributeTypes] = useState<
    AttributeType[]
  >([]);
  const [possibleAttributeParameters, setPossibleAttributeParameters] =
    useState<AttributeParameter[]>([]);

  const loadKeyTypes = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attribute-types`,
    });

    setPossibleAttributeTypes(data);
  };

  const loadKeyParameters = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attribute-parameters/`,
    });

    const nonSystemAttributes = data.filter((item) => !item.isSystem);

    setPossibleAttributeParameters(nonSystemAttributes);
  };

  useEffect(() => {
    if (isOpen) {
      loadKeyParameters();
      loadKeyTypes();
      return;
    }

    setNewName("");
    setSelectedType(undefined);
    setDateFormat(undefined);
  }, [isOpen]);

  useEffect(() => {
    setDateFormat(undefined);
  }, [selectedType]);

  const handleSave = async () => {
    if (
      !selectedType ||
      !newName ||
      ([StatementValueType.DATE, StatementValueType.DATE_TIME].includes(
        selectedType.name as StatementValueType
      ) &&
        !dateFormat) ||
      isLoading
    )
      return;

    setIsLoading(true);
    try {
      console.log(JSON.stringify(selectedType, null, 2));
      await ApiService.post({
        url: `/customers/attributes/create`,
        options: {
          name: newName.trim(),
          attribute_type: selectedType,
        },
      });
      onAdded(newName, selectedType, dateFormat);
    } catch (error) {
      toast.error("Apply another type or name.");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;

    onClose();
  };

  return (
    <>
      <FlowBuilderModal
        isOpen={isOpen}
        onClose={handleClose}
        className="!max-w-[500px] !w-full"
      >
        <div className="font-roboto">
          <div className="font-inter text-xl text-[#111827] font-semibold">
            Add an Attribute
          </div>
          <hr className="border-[#E5E7EB] my-3" />
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#111827] font-inter">
                Attribute Name
              </span>
              <Input
                wrapperClassName="!max-w-[300px] !w-full"
                className="!max-w-[300px] !w-full"
                placeholder="my-attribute-name"
                value={newName}
                onChange={setNewName}
                id="fieldNameInput"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#111827] font-inter">Type</span>
              <Select
                value={selectedType?.name}
                placeholder="Select type"
                id="selectTypeInput"
                className="max-w-[300px] w-full"
                options={Object.values(possibleAttributeTypes).map(
                  (attrType) => ({
                    key: attrType.name,
                    title: attrType.name,
                  })
                )}
                onChange={(typeName) =>
                  setSelectedType(
                    possibleAttributeTypes.find((possibleType) => {
                      return possibleType.name === typeName;
                    })
                  )
                }
              />
            </div>
            {selectedType && selectedType.parameters_required && (
              <div
                className="flex justify-between items-center mt-3"
                id="dateFormatPicker"
              >
                <span className="text-sm text-[#111827] font-inter">
                  {selectedType.name === "Date" ? "Date" : "Date-time"} format
                </span>
                <DateFormatPicker
                  value={dateFormat || ""}
                  type={StatementValueType.DATE}
                  onChange={setDateFormat}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end items-center mt-6 gap-2">
            <Button
              type={ButtonType.SECONDARY}
              disabled={isLoading}
              className="!border-[#E5E7EB] !text-[#111827]"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !newName ||
                !selectedType ||
                ([
                  StatementValueType.DATE,
                  StatementValueType.DATE_TIME,
                ].includes(selectedType.name as StatementValueType) &&
                  !dateFormat) ||
                isLoading
              }
              type={ButtonType.PRIMARY}
              onClick={handleSave}
              id="saveAddAttributeModalButton"
            >
              Save
            </Button>
          </div>
        </div>
      </FlowBuilderModal>
    </>
  );
};

export default AddAttributeModal;
