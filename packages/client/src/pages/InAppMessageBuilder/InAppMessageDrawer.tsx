import React, { FC, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { templates } from "./templates";
import TemplateLayout from "./TemplateLayout";

interface IInAppMessageDrawerProps {
  setSelectedTemplateId: (id: string | null) => void;
}

const InAppMessageDrawer: FC<IInAppMessageDrawerProps> = ({
  setSelectedTemplateId,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string[] | null>(
    templates.map((category) => category.category)
  );

  return (
    <div className="min-w-[360px] w-[360px] border-col border-right-[1px] border-[#E5E7EB] bg-white h-full px-[10px]">
      <div className="text-[#111827] text-[16px] font-semibold leading-[24px] font-segoe">
        Start with a template
      </div>
      <Scrollbars>
        <div className="flex flex-col gap-5 pt-[10px] pb-[20px]">
          {templates.map((category) => {
            return (
              <div>
                <div className="border-b border-gray-300 pb-2">
                  <button
                    className="flex justify-between items-center w-full text-left text-[#111827] font-medium text-[14px] py-2"
                    onClick={() => {
                      setExpandedCategory((prev) =>
                        prev?.includes(category.category)
                          ? prev.filter((cat) => cat !== category.category)
                          : [...(prev || []), category.category]
                      );
                    }}
                  >
                    <span>{category.category}</span>
                    <span>
                      {expandedCategory?.includes(category.category)
                        ? "▲"
                        : "▼"}
                    </span>
                  </button>
                  {expandedCategory?.includes(category.category) && (
                    <div className="flex flex-row gap-[10px] flex-wrap mt-2">
                      {category.templates.map((template) => {
                        return (
                          <button
                            key={template.id}
                            className="w-[165px] h-[165px] bg-[#E5E7EB] rounded-[4px] flex justify-center items-center cursor-pointer"
                            onClick={() => {
                              if (template.id) {
                                setSelectedTemplateId(template.id);
                              }
                            }}
                          >
                            <TemplateLayout
                              template={template}
                              isPreview={true}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Scrollbars>
    </div>
  );
};

export default InAppMessageDrawer;
