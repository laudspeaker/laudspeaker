import { useState } from "react";
import { MenuItem } from "@mui/material";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { GenericButton, Select, Input } from "components/Elements";

import { BackButtonIcon } from "../../../components/Icons/Icons";
import { useNavigate } from "react-router-dom";

export interface IEmailHeaderProps {
  onPersonalize: (e: any) => void;
  onSave: (e: any) => void;
  templateName: string;
  handleTemplateNameChange: (e: any) => void;
}

const EmailHeader = (props: IEmailHeaderProps) => {
  const navigate = useNavigate();
  const { onPersonalize, templateName, handleTemplateNameChange, onSave } =
    props;
  const [activeJourney, setActiveJourney] = useState("Email");
  const [titleEdit, setTitleEdit] = useState<boolean>(false);

  const handleActiveJourney = (e: any) => {
    setActiveJourney(e.target.value);
  };

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  const goToSlackBuilder = () => {
    navigate("/slack-builder");
    return;
  };

  return (
    <div>
      <div className="px-[40px] justify-between flex h-[80px]">
        <h6 className="font-[Poppins] not-italic font-medium text-[14px] leading-[30px] flex items-center">
          <div className="min-w-[16px] pr-[16px]">{BackButtonIcon()}</div>
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
          <form className="max-w-[300px] pl-[15px] min-w-[112px]">
            <Select
              id="activeJourney"
              value={activeJourney}
              onChange={handleActiveJourney}
              displayEmpty
            >
              <MenuItem value={"Email"}>Email</MenuItem>
              <MenuItem value={"Slack"} onClick={goToSlackBuilder}>
                Slack
              </MenuItem>
            </Select>
          </form>
          <GenericButton
            customClasses="!ml-[10px]"
            onClick={onSave}
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
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
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
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
