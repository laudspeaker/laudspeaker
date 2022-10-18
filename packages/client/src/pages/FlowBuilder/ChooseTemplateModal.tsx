import { useEffect, useState } from "react";
import { Box, Typography, Modal, FormControl, MenuItem } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";

interface IChooseTemplateModal {
  templateModalOpen: boolean;
  handleTemplateModalOpen: (e: any) => void;
  selectedMessageType: string;
  isCollapsible: boolean;
  onClose: () => void;
  selectedTemplateId?: string | number;
  onTemplateDelete?: () => void;
}
const ChooseTemplateModal = ({
  templateModalOpen,
  handleTemplateModalOpen,
  selectedMessageType,
  isCollapsible,
  onClose,
  selectedTemplateId,
  onTemplateDelete,
}: IChooseTemplateModal) => {
  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: 0,
    borderRadius: "10px",
    boxShadow: 24,
    p: 4,
  };
  const [templatesList, setTemplatesList] = useState<any>([]);
  const [activeTemplate, setActiveTemplate] = useState<any>(
    selectedTemplateId || ""
  );

  function renderButton(data: any) {
    if (data.length < 1) {
      return (
        <>
          <GenericButton
            onClick={(_) => {
              handleTemplateModalOpen({ activeTemplate, selectedMessageType });
            }}
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
            }}
          >
            Exit
          </GenericButton>
        </>
      );
    } else {
      //this is a test for checking if this is the journeys table or the template table
      return (
        <>
          <GenericButton
            onClick={(_) => {
              console.log(_);
              handleTemplateModalOpen({ activeTemplate, selectedMessageType });
            }}
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              margin: "0 5px",
            }}
          >
            Export
          </GenericButton>
          {onTemplateDelete && (
            <GenericButton
              onClick={(_) => {
                onTemplateDelete();
              }}
              style={{
                maxWidth: "158px",
                maxHeight: "48px",
                "background-image":
                  "linear-gradient(to right, #c0c0c0 , #787878, #465265)",
                margin: "0 5px",
              }}
            >
              Delete
            </GenericButton>
          )}
        </>
      );
    }
  }

  const handleActiveTemplate = (e: any) => {
    setActiveTemplate(e.target.value);
  };
  useEffect(() => {
    const getAllTemplates = async () => {
      const response = await ApiService.get({
        url: `${ApiConfig.getAllTemplates}`,
      });
      const filteredTemplates = response?.data?.filter(
        (item: any) => item.type === selectedMessageType
      );
      setTemplatesList(filteredTemplates);
    };
    getAllTemplates();
  }, []);
  return (
    <Modal
      open={templateModalOpen}
      onClose={() => handleTemplateModalOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        {isCollapsible && (
          <button
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              border: "0px",
              background: "transparent",
              outline: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            x
          </button>
        )}
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Choose {selectedMessageType} template
        </Typography>
        <Box>
          <FormControl
            sx={{
              width: "100%",
              minWidth: "112px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <Select
              id="activeJourney"
              value={activeTemplate}
              onChange={handleActiveTemplate}
              displayEmpty
            >
              {templatesList.map((template: any) => {
                return <MenuItem value={template.id}>{template.name}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>
        <Box data-slackexporttemplate>{renderButton(templatesList)}</Box>
      </Box>
    </Modal>
  );
};

export default ChooseTemplateModal;
