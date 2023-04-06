import { useEffect, useState } from "react";
import { GenericButton, Select } from "components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import Template from "types/Template";
import SideModal from "components/Elements/SideModal";

interface IChooseTemplateModal {
  templateModalOpen: boolean;
  handleTemplateModalOpen: (val?: {
    activeTemplate: number | undefined;
    selectedMessageType: string;
  }) => void;
  selectedMessageType: string;
  isCollapsible: boolean;
  onClose: () => void;
  isViewMode?: boolean;
  selectedTemplateId?: number;
  onTemplateDelete?: () => void;
}
const ChooseTemplateModal = ({
  templateModalOpen,
  handleTemplateModalOpen,
  selectedMessageType,
  isViewMode = false,
  selectedTemplateId,
  onTemplateDelete,
  onClose,
}: IChooseTemplateModal) => {
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState(selectedTemplateId);

  function renderButton(data: Template[]) {
    if (data.length < 1) {
      return (
        <>
          <GenericButton
            onClick={() => {
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
            onClick={() => {
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
              onClick={() => {
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

  const handleActiveTemplate = (value?: number) => {
    setActiveTemplate(value);
  };

  const getAllTemplates = async () => {
    const { data: templates } = await ApiService.get({
      url: `${ApiConfig.getAllTemplates}`,
    });
    const filteredTemplates = templates?.data?.filter(
      (item: { type?: string }) => item.type === selectedMessageType
    );
    setTemplatesList(filteredTemplates);
  };

  useEffect(() => {
    getAllTemplates();
  }, [selectedMessageType]);
  return (
    <SideModal isOpen={templateModalOpen} onClose={onClose}>
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
              options={templatesList.map((template) => ({
                value: template.id,
                title: template.name,
              }))}
              customButtonClass={`${
                isViewMode && "!bg-gray-200 !cursor-auto opacity-[0.7]"
              }`}
              onChange={handleActiveTemplate}
              displayEmpty
              disabled={isViewMode}
              data-select-template
            />
          </form>
        </div>
        {!isViewMode && (
          <div data-slackexporttemplate>{renderButton(templatesList)}</div>
        )}
      </div>
    </SideModal>
  );
};

export default ChooseTemplateModal;
