import { ApiConfig } from "../../../../constants";
import NodeData from "pages/FlowBuilderv3/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { Node } from "reactflow";
import ApiService from "services/api.service";
import Template from "types/Template";

interface MessageSettingsProps {
  node?: Node<NodeData>;
}

const MessageSettings: FC<MessageSettingsProps> = ({ node }) => {
  const templateType = node?.data.template?.type;

  const [selectedTemplate, setSelectedTemplate] = useState(
    node?.data.template?.selected?.id
  );
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
          placeholder="select template"
          value={selectedTemplate || ""}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
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
