import { useState } from "react";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { GenericButton, Input } from "components/Elements";

import { BackButtonIcon } from "../../../components/Icons/Icons";

export interface IEmailHeaderProps {
  onPersonalize: (e: any) => void;
  onSave: (e: any) => void;
  templateName: string;
  handleTemplateNameChange: (e: any) => void;
}

const EmailHeader = (props: IEmailHeaderProps) => {
  const { onPersonalize, templateName, handleTemplateNameChange, onSave } =
    props;
  const [titleEdit, setTitleEdit] = useState<boolean>(false);

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  return (
    <div>
      <div className="px-[40px] justify-between flex h-[80px]">
        <h6 className="font-[Poppins] not-italic font-medium text-[14px] leading-[30px] flex items-center">
          <div
            id="turnBackFromTemplate"
            className="min-w-[16px] pr-[16px] cursor-pointer"
            onClick={() => window.history.back()}
          >
            {BackButtonIcon()}
          </div>
          {!titleEdit ? (
            <h3 className="flex items-center gap-[10px]">
              {templateName}
              <PencilIcon
                className="w-[24px] h-[24px] text-[25px] cursor-pointer"
                onClick={handleTitleEdit}
              />
            </h3>
          ) : (
            <Input
              value={templateName}
              placeholder={"Enter segment title"}
              name="title"
              id="title"
              onChange={handleTemplateNameChange}
              onKeyDown={handleTitleEnter}
              autoFocus
              inputProps={{
                style: {
                  padding: "0px",
                  background: "#fff",
                  fontFamily: "Inter",
                  fontWeight: "600",
                  fontSize: "25px",
                  color: "#28282E",
                },
              }}
            />
          )}
        </h6>
        <div className="flex items-center justify-between max-w-[500px]">
          <GenericButton
            id="saveDraftTemplate"
            customClasses="!ml-[10px]"
            onClick={onSave}
            style={{
              whiteSpace: "nowrap",
              maxWidth: "158px",
              maxHeight: "48px",
            }}
          >
            Save Draft
          </GenericButton>
          <GenericButton
            onClick={onPersonalize}
            customClasses="ml-[10px]"
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
            }}
          >
            Personalize
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default EmailHeader;
