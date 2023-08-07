import { ApiConfig } from "../../../../constants";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import Template from "types/Template";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import { MessageNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";

const MessageSettings: FC<SidePanelComponentProps<MessageNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const templateType = nodeData.template?.type;
  const selectedTemplateId = nodeData.template?.selected?.id;

  const [templateList, setTemplateList] = useState<Template[]>([]);

  const getAllTemplates = async () => {
    const { data: templates } = await ApiService.get<{ data: Template[] }>({
      url: `${ApiConfig.getAllTemplates}`,
    });

    const filteredTemplates = templates?.data?.filter(
      (item: { type?: string }) => item.type === templateType
    );
    setTemplateList(filteredTemplates);
  };

  useEffect(() => {
    getAllTemplates();
  }, [templateType]);

  if (!templateType) return <>Unknown template type!</>;

  return (
    <div className="flex justify-between items-center">
      <div className="font-inter font-normal text-[14px] leading-[22px]">
        Template
      </div>
      <div>
        <select
          className="w-[200px] h-[32px] rounded-[2px] px-[12px] py-[4px] text-[14px] font-roboto leading-[22px]"
          id="template-select"
          value={selectedTemplateId}
          onChange={(e) =>
            setNodeData({
              ...nodeData,
              template: {
                type: templateType,
                selected: {
                  id: +e.target.value,
                  name:
                    templateList.find(
                      (template) => template.id === +e.target.value
                    )?.name || "",
                },
              },
            })
          }
        >
          <option disabled selected value={undefined}>
            select template
          </option>
          {templateList.map((template) => (
            <option value={template.id} key={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MessageSettings;
