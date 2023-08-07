import {
  Condition,
  ElementKey,
  LogicRelation,
  StatementType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { useAppSelector } from "store/hooks";
import { ProviderType } from "types/Workflow";

interface ConditionViewerProps {
  condition: Condition;
  onEdit: () => void;
  onDelete: () => void;
}

const ConditionViewer: FC<ConditionViewerProps> = ({
  condition,
  onEdit,
  onDelete,
}) => {
  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  return (
    <div className="p-[10px] flex flex-col gap-[10px] bg-[#F3F4F6]">
      <div className="flex justify-between items-center">
        <div className="font-inter font-semibold text-[14px] leading-[22px]">
          {condition.providerType === ProviderType.CUSTOM
            ? "Custom Event"
            : condition.providerType === ProviderType.POSTHOG
            ? `Posthog ${condition.name}`
            : "Tracker"}
        </div>
        <div className="flex gap-[20px] items-center">
          <div
            className="edit-condition cursor-pointer"
            onClick={isOnboarding ? undefined : onEdit}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3313_4950)">
                <path
                  d="M3.45726 12.284C3.49297 12.284 3.52868 12.2805 3.5644 12.2751L6.56797 11.7483C6.60368 11.7412 6.63761 11.7251 6.66261 11.6983L14.2323 4.12868C14.2488 4.11216 14.2619 4.09254 14.2709 4.07094C14.2799 4.04934 14.2845 4.02618 14.2845 4.00279C14.2845 3.9794 14.2799 3.95625 14.2709 3.93464C14.2619 3.91304 14.2488 3.89342 14.2323 3.8769L11.2644 0.907254C11.2305 0.873326 11.1858 0.855469 11.1376 0.855469C11.0894 0.855469 11.0448 0.873326 11.0108 0.907254L3.44118 8.4769C3.4144 8.50368 3.39833 8.53583 3.39118 8.57154L2.8644 11.5751C2.84703 11.6708 2.85323 11.7692 2.88248 11.862C2.91173 11.9547 2.96314 12.0389 3.03225 12.1073C3.15011 12.2215 3.29833 12.284 3.45726 12.284ZM4.66083 9.16975L11.1376 2.69475L12.4465 4.00368L5.96976 10.4787L4.38226 10.759L4.66083 9.16975ZM14.5698 13.784H1.4269C1.11083 13.784 0.855469 14.0394 0.855469 14.3555V14.9983C0.855469 15.0769 0.919754 15.1412 0.998326 15.1412H14.9983C15.0769 15.1412 15.1412 15.0769 15.1412 14.9983V14.3555C15.1412 14.0394 14.8858 13.784 14.5698 13.784Z"
                  fill="#111827"
                />
              </g>
              <defs>
                <clipPath id="clip0_3313_4950">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div
            className="delete-condition cursor-pointer"
            onClick={isOnboarding ? undefined : onDelete}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.28739 2.14118H5.14453C5.2231 2.14118 5.28739 2.0769 5.28739 1.99833V2.14118H10.716V1.99833C10.716 2.0769 10.7802 2.14118 10.8588 2.14118H10.716V3.4269H12.0017V1.99833C12.0017 1.36797 11.4892 0.855469 10.8588 0.855469H5.14453C4.51417 0.855469 4.00167 1.36797 4.00167 1.99833V3.4269H5.28739V2.14118ZM14.2874 3.4269H1.71596C1.39989 3.4269 1.14453 3.68225 1.14453 3.99833V4.56975C1.14453 4.64833 1.20882 4.71261 1.28739 4.71261H2.36596L2.80703 14.0519C2.8356 14.6608 3.33917 15.1412 3.9481 15.1412H12.0552C12.666 15.1412 13.1677 14.6626 13.1963 14.0519L13.6374 4.71261H14.716C14.7945 4.71261 14.8588 4.64833 14.8588 4.56975V3.99833C14.8588 3.68225 14.6035 3.4269 14.2874 3.4269ZM11.9177 13.8555H4.0856L3.65346 4.71261H12.3499L11.9177 13.8555Z"
                fill="#111827"
              />
            </svg>
          </div>
        </div>
      </div>

      {condition.providerType === ProviderType.TRACKER ? (
        <div className="flex flex-col gap-[10px] font-inter text-[14px] font-normal text-[#111827] leading-[22px]">
          {condition.trackerId && (
            <div className="flex gap-[5px] items-center">
              <div>Tracker:</div>
              <div className="px-[5px] py-[2px] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                {condition.trackerId}
              </div>
            </div>
          )}
          {condition.event && (
            <div className="flex gap-[5px] items-center">
              <div>Event</div>
              <div className="px-[5px] py-[2px] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                {condition.event}
              </div>
              <div>is performed</div>
            </div>
          )}
        </div>
      ) : (
        <>
          {condition.statements.map((statement, k) => (
            <div className="flex gap-[10px]" key={k}>
              {k !== 0 && (
                <div className="bg-[#E5E7EB] border-[#E5E7EB] border-[1px] w-[40px] h-[22px] flex items-center justify-center font-roboto font-normal text-[14px] leading-[22px]">
                  {condition.statements[k - 1].relationToNext ===
                  LogicRelation.AND
                    ? "And"
                    : "Or"}
                </div>
              )}
              {statement.type === StatementType.PROPERTY ? (
                <div
                  className="font-inter font-normal text-[14px] leading-[22px]"
                  key={k}
                >
                  Property "{statement.key}" {statement.comparisonType} "
                  {statement.value}"
                </div>
              ) : (
                <div
                  className="font-inter font-normal text-[14px] leading-[22px]"
                  key={k}
                >
                  Element <span className="font-bold">#{statement.order}</span>{" "}
                  "
                  {statement.elementKey === ElementKey.TAG_NAME
                    ? "Tag name"
                    : "Text"}
                  " {statement.comparisonType} "{statement.value}"
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ConditionViewer;
