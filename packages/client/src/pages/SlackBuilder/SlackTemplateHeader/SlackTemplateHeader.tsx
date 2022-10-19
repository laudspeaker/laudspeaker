import { useState } from "react";
import { Box, Typography, Divider, FormControl, MenuItem } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ListItemIcon from "@mui/material/ListItemIcon";
import { GenericButton, Select, Input } from "components/Elements";

import { BackButtonIcon } from "../../../components/Icons/Icons";
import { useNavigate } from "react-router-dom";

export interface IEmailHeaderProps {
  onPersonalizeClick: (e: any) => void;
  onSave: (e: any) => void;
  templateName: string;
  handleTemplateNameChange: (e: any) => void;
}

const SlackTemplateHeader = (props: IEmailHeaderProps) => {
  const navigate = useNavigate();
  const { onPersonalizeClick, templateName, handleTemplateNameChange, onSave } =
    props;
  const [activeJourney, setActiveJourney] = useState("Slack");
  const [titleEdit, setTitleEdit] = useState<boolean>(false);

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  const goToEmailBuilder = () => {
    navigate("/email-builder");
    return;
  };

  const handleActiveJourney = (e: any) => {
    if (e.target.value === "Email") goToEmailBuilder();
    setActiveJourney(e.target.value);
  };

  return (
    <div>
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          justifyContent: "space-between",
          marginLeft: "10px",
          height: "80px",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: "500",
            fontSize: "14px",
            lineHeight: "30px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ListItemIcon sx={{ minWidth: "16px", paddingRight: "16px" }}>
            {BackButtonIcon()}
          </ListItemIcon>
          {!titleEdit ? (
            <Typography
              variant="h3"
              display={"flex"}
              alignItems="center"
              gap="10px"
            >
              {templateName}
              <EditIcon
                sx={{ fontSize: "25px", cursor: "pointer" }}
                onClick={handleTitleEdit}
              />
            </Typography>
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
        </Typography>
        <Divider />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "400px",
            paddingRight: "50px",
          }}
        >
          <Box>
            <FormControl
              sx={{ maxWidth: "300px", paddingLeft: "15px", minWidth: "112px" }}
            >
              <Select
                id="activeJourney"
                value={activeJourney}
                options={[{ value: "Email" }, { value: "Slack" }]}
                onChange={handleActiveJourney}
                displayEmpty
                // sx={ border: "1px solid #D1D5DB"}
              />
            </FormControl>
          </Box>
          <Box>
            <GenericButton
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
          </Box>
          <Box>
            <GenericButton
              data-slackexporttemplate
              onClick={onPersonalizeClick}
              style={{
                maxWidth: "158px",
                maxHeight: "48px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Personalize
            </GenericButton>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default SlackTemplateHeader;
