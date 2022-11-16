import { useEffect, useState } from "react";
import { GenericButton, Select } from "components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import Modal from "../../components/Elements/Modal";

interface IChooseTemplateModal {
  templateModalOpen: boolean;
  handleTemplateModalOpen: (e: any) => void;
  selectedMessageType: string;
  isCollapsible: boolean;
  onClose: () => void;
  isViewMode?: boolean;
  selectedTemplateId?: string | number;
  onTemplateDelete?: () => void;
}
const ChooseTemplateModal = ({
  templateModalOpen,
  handleTemplateModalOpen,
  selectedMessageType,
  isCollapsible,
  isViewMode = false,
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
            id="exportSelectedTemplate"
            onClick={(_) => {
              console.log(_);
              handleTemplateModalOpen({ activeTemplate, selectedMessageType });
            }}
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
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
        <h6 id="modal-modal-title">
          {isViewMode
            ? `Chosen ${selectedMessageType} template`
            : `Choose ${selectedMessageType} template`}
        </h6>
        <div>
          <form className="w-full my-[20px]">
            <Select
              id="activeJourney"
              value={activeTemplate}
              options={templatesList.map((template: any) => ({
                value: template.id,
                title: template.name,
              }))}
              customButtonClass={`${
                isViewMode && "!bg-gray-200 !cursor-auto opacity-[0.7]"
              }`}
              onChange={handleActiveTemplate}
              displayEmpty
              disabled={isViewMode}
            />
          </form>
        </div>
        {!isViewMode && (
          <div data-slackexporttemplate>{renderButton(templatesList)}</div>
        )}
      </div>
    </Modal>
  );
};

export default ChooseTemplateModal;
