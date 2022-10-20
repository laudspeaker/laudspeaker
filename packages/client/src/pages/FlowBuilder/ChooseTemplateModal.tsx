import { useEffect, useState } from "react";
import { Box, Typography, FormControl, MenuItem } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import Modal from "components/Elements/Modal";

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

  const handleActiveTemplate = (value: any) => {
    setActiveTemplate(value);
  };
  useEffect(() => {
    const getAllTemplates = async () => {
      const { data: templates } = await ApiService.get({
        url: `${ApiConfig.getAllTemplates}`,
      });
      const filteredTemplates = templates?.data?.filter(
        (item: any) => item.type === selectedMessageType
      );
      setTemplatesList(filteredTemplates);
    };
    getAllTemplates();
  }, []);
  return (
    <Modal
      isOpen={templateModalOpen}
      onClose={() => handleTemplateModalOpen(false)}
    >
      <div className="w-full">
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Choose {selectedMessageType} template
        </Typography>
        <Box>
          <form className="w-full my-[20px]">
            <Select
              id="activeJourney"
              value={activeTemplate}
              options={templatesList.map((template: any) => ({
                value: template.id,
                title: template.name,
              }))}
              onChange={handleActiveTemplate}
              displayEmpty
            />
          </form>
        </Box>
        <Box data-slackexporttemplate>{renderButton(templatesList)}</Box>
      </div>
    </Modal>
  );
};

export default ChooseTemplateModal;
