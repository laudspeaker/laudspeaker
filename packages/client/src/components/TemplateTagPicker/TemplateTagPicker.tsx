import { Select } from "components/Elements";
import Chip from "components/Elements/Chip";
import Modal from "components/Elements/Modal";
import React, {
  ChangeEvent,
  FC,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ApiService from "services/api.service";
import Template from "types/Template";

interface TemplateTagPickerProps {
  itemContent: string;
  handleValueReplace: (regExp: RegExp | string, str: string) => void;
}

const possibleProperyNameMap: Record<string, { value: string }[]> = {
  email: [{ value: "subject" }, { value: "body" }],
  sms: [{ value: "smsMessage" }],
  slack: [{ value: "slackMessage" }],
  firebase: [{ value: "firebaseTitle" }],
};

const TemplateTagPicker: FC<TemplateTagPickerProps> = ({
  itemContent,
  handleValueReplace,
}) => {
  const [initialTemplateType, initialTemplateName, initialTemplateProperty] =
    itemContent.split(";");

  const [templateType, setTemplateType] = useState(initialTemplateType.trim());
  const [templateName, setTemplateName] = useState(initialTemplateName.trim());
  const [templateProperty, setTemplateProperty] = useState(
    initialTemplateProperty.trim()
  );
  const [possibleTemplates, setPossibleTemplates] = useState<Template[]>([]);
  const [isTemplateTagModalOpen, setIsTemplateTagModalOpen] = useState(false);

  const spanRef = useRef<HTMLSpanElement>(null);
  const [searchStr, setSearchStr] = useState("");

  useLayoutEffect(() => {
    (async () => {
      const { data: body } = await ApiService.get<{ data: Template[] }>({
        url: "/templates",
      });
      setPossibleTemplates(body.data);
    })();
  }, []);

  useEffect(() => {
    handleValueReplace(
      `[[${itemContent}]]`,
      `[[ ${templateType || "email"};${templateName || "any-name"};${
        templateProperty || "any-property"
      } ]]`
    );
  }, [templateType, templateName, templateProperty]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    setSearchStr(e.target.value);
  };

  const handleTypeChange = (type: string) => {
    setTemplateType(type);
    setTemplateProperty(possibleProperyNameMap?.[type]?.[0]?.value);
  };

  return (
    <>
      <span
        className="h-full"
        onClick={() => setIsTemplateTagModalOpen(true)}
        ref={spanRef}
      >
        <Chip
          label={
            templateType && templateName && templateProperty
              ? `${templateType}: ${templateName} (${templateProperty})`
              : "specify the property here"
          }
          textClass="text-[20px]"
        />
      </span>
      <Modal
        isOpen={isTemplateTagModalOpen}
        onClose={() => setIsTemplateTagModalOpen(false)}
      >
        <div className="py-5 px-[15px] outline-none">
          <div>Type:</div>
          <Select
            value={templateType}
            options={[
              { value: "email" },
              { value: "slack" },
              { value: "sms" },
              { value: "firebase" },
            ]}
            onChange={(val) => handleTypeChange(val)}
          />
          <div>Template name:</div>
          <Select
            value={templateName}
            onChange={(val) => setTemplateName(val)}
            options={possibleTemplates
              .filter((template) => template.type === templateType)
              .map((template) => ({ value: template.name }))}
          />
          <div>Subtype:</div>
          <Select
            value={templateProperty}
            onChange={(val) => setTemplateProperty(val)}
            options={possibleProperyNameMap[templateType]}
          />

          {/* Todo: autocomplete */}
          {/* <Autocomplete
            inputId="templateName"
            inputValue={searchStr}
            onInputChange={(e) => setSearchStr(e.target.value)}
            onOptionSelect={(value) => setTemplateName(value)}
          /> */}

          {/* <form className="mb-[2.5px]">
            <p className="text-[#223343] font-[Poppins] font-normal leading-[30px] ml-[5px]">
              Search for Customer Properties
            </p>
            <input
              id="merge-tag-filter-input"
              name="merge-tag-filter-input"
              placeholder="define your own property here"
              value={searchStr}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="!bg-[#E5E5E5] outline-none !rounded-[10px] !py-[12px] !px-5 font-[Poppins] not-italic font-normal text-[16px] leading-[30px]  min-w-[280px] min-h-[23px]"
            />
          </form>
          <div className="overflow-y-scroll max-h-[260px]">
            {possibleTemplates
              .filter((str) =>
                str
                  .replace(" ", "")
                  .toLowerCase()
                  .includes(searchStr.toLowerCase())
              )
              .map((attribute, index) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValueReplace(`{{${tagContent}}}`, `{{${attribute}}}`);
                    handleClose();
                  }}
                  className="min-w-[338px] h-[62px] border border-[#F3F3F3] rounded-[5px] font-[Inter] font-medium not-italic text-[16px] leading-[24px]  my-[2.5px] mx-0 p-[5px]  flex justify-start items-start"
                  key={index}
                >
                  <div>{attribute}</div>
                </div>
              ))}
          </div> */}
        </div>
      </Modal>
    </>
  );
};

export default TemplateTagPicker;
