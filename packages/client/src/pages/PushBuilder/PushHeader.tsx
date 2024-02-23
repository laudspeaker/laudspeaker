import Button, { ButtonType } from "components/Elements/Buttonv2";
import React, { useState } from "react";
import { useAppSelector } from "store/hooks";
import PushBuilderRenameModal from "./PushBuilderRenameModal";

interface PushHeaderProps {
  templateName: string;
  pageIndex: number;
  setPageIndex: (index: number) => void;
  onSave: (newName?: string) => Promise<void>;
  isSaving?: boolean;
  handleBackToJourney?: () => Promise<void>;
  isInlineCreator?: boolean;
  stepperNames?: string[];
}

const StepperFixtures: { text: string; icon: React.ReactNode }[] = [
  {
    text: "Push",
    icon: (
      <svg
        width="17"
        height="16"
        viewBox="0 0 17 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_3834_6189)">
          <path
            d="M8.5 0C4.08214 0 0.5 3.58214 0.5 8C0.5 12.4179 4.08214 16 8.5 16C12.9179 16 16.5 12.4179 16.5 8C16.5 3.58214 12.9179 0 8.5 0ZM8.5 14.6429C4.83214 14.6429 1.85714 11.6679 1.85714 8C1.85714 4.33214 4.83214 1.35714 8.5 1.35714C12.1679 1.35714 15.1429 4.33214 15.1429 8C15.1429 11.6679 12.1679 14.6429 8.5 14.6429Z"
            fill="currentColor"
          />
          <path
            d="M9.4987 4V11.6354H8.29036V5.47917C8.07161 5.63542 7.8355 5.7691 7.58203 5.88021C7.33203 5.98785 7.04557 6.08333 6.72266 6.16667V5.13542C6.92405 5.06944 7.11849 5 7.30599 4.92708C7.49349 4.85417 7.67752 4.77257 7.85807 4.68229C8.0421 4.59201 8.22613 4.49132 8.41016 4.38021C8.59766 4.2691 8.79036 4.14236 8.98828 4H9.4987Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_3834_6189">
            <rect
              width="16"
              height="16"
              fill="white"
              transform="translate(0.5)"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    text: "Test",
    icon: (
      <svg
        width="17"
        height="16"
        viewBox="0 0 17 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_3834_7513)">
          <path
            d="M8.5 0C4.08214 0 0.5 3.58214 0.5 8C0.5 12.4179 4.08214 16 8.5 16C12.9179 16 16.5 12.4179 16.5 8C16.5 3.58214 12.9179 0 8.5 0ZM8.5 14.6429C4.83214 14.6429 1.85714 11.6679 1.85714 8C1.85714 4.33214 4.83214 1.35714 8.5 1.35714C12.1679 1.35714 15.1429 4.33214 15.1429 8C15.1429 11.6679 12.1679 14.6429 8.5 14.6429Z"
            fill="currentColor"
          />
          <path
            d="M10.9648 11.5938H6.27734V11.0156C6.27734 10.7795 6.31033 10.559 6.3763 10.3542C6.44227 10.1458 6.53082 9.95139 6.64193 9.77083C6.75304 9.58681 6.88325 9.41493 7.03255 9.25521C7.18186 9.09201 7.34158 8.93576 7.51172 8.78646C7.68186 8.63368 7.85547 8.48785 8.03255 8.34896C8.20964 8.2066 8.38325 8.06424 8.55339 7.92188C8.71311 7.78646 8.85894 7.65451 8.99089 7.52604C9.12283 7.3941 9.23568 7.25868 9.32943 7.11979C9.42318 6.9809 9.49609 6.83507 9.54818 6.68229C9.60026 6.52604 9.6263 6.35764 9.6263 6.17708C9.6263 5.97917 9.59505 5.80729 9.53255 5.66146C9.47352 5.51215 9.38845 5.38889 9.27734 5.29167C9.1697 5.19097 9.04123 5.11632 8.89193 5.06771C8.74262 5.01562 8.57943 4.98958 8.40234 4.98958C8.09679 4.98958 7.78602 5.06076 7.47005 5.20312C7.15408 5.34549 6.85026 5.55903 6.55859 5.84375V4.68229C6.71137 4.56771 6.86589 4.46875 7.02214 4.38542C7.17839 4.29861 7.33984 4.22743 7.50651 4.17188C7.67318 4.11285 7.84852 4.06944 8.03255 4.04167C8.21658 4.01389 8.41276 4 8.62109 4C8.9579 4 9.26345 4.04514 9.53776 4.13542C9.81207 4.22222 10.0464 4.35243 10.2409 4.52604C10.4353 4.69618 10.5846 4.90972 10.6888 5.16667C10.7964 5.42361 10.8503 5.71875 10.8503 6.05208C10.8503 6.35417 10.8121 6.62674 10.7357 6.86979C10.6628 7.10938 10.5569 7.33333 10.418 7.54167C10.2826 7.75 10.1176 7.94792 9.92318 8.13542C9.72873 8.32292 9.51172 8.51562 9.27214 8.71354C9.07075 8.87674 8.86936 9.03646 8.66797 9.19271C8.47005 9.34549 8.29123 9.49653 8.13151 9.64583C7.97179 9.79167 7.84158 9.93924 7.74089 10.0885C7.64366 10.2344 7.59505 10.3819 7.59505 10.5312V10.5573H10.9648V11.5938Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_3834_7513">
            <rect
              width="16"
              height="16"
              fill="white"
              transform="translate(0.5)"
            />
          </clipPath>
        </defs>
      </svg>
    ),
  },
];

export const PushHeader = ({
  isInlineCreator,
  templateName,
  pageIndex,
  setPageIndex,
  onSave,
  isSaving,
  handleBackToJourney,
  stepperNames,
}: PushHeaderProps) => {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const { templateInlineCreation } = useAppSelector(
    (state) => state.flowBuilder
  );

  return (
    <div className="w-full px-[14.5px] flex justify-between items-center h-[60px] border-y-[1px] border-[#E5E7EB] bg-white font-segoe font-normal text-[16px] text-[#111827] leading-[24px]">
      {(!isInlineCreator || templateInlineCreation?.templateId) && (
        <>
          <div className="flex items-center ml-[16px]">
            <div className="text-ellipsis max-w-[260px] overflow-hidden mr-[16px] font-inter font-normal text-[14px] leading-[22px]">
              {templateName}
            </div>
            <div
              className="cursor-pointer"
              onClick={() => setIsRenameModalOpen(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_2222_57368)">
                  <path
                    d="M3.45921 12.284C3.49492 12.284 3.53064 12.2805 3.56635 12.2751L6.56992 11.7483C6.60564 11.7412 6.63957 11.7251 6.66457 11.6983L14.2342 4.12868C14.2508 4.11216 14.2639 4.09254 14.2729 4.07094C14.2818 4.04934 14.2864 4.02618 14.2864 4.00279C14.2864 3.9794 14.2818 3.95625 14.2729 3.93464C14.2639 3.91304 14.2508 3.89342 14.2342 3.8769L11.2664 0.907254C11.2324 0.873326 11.1878 0.855469 11.1396 0.855469C11.0914 0.855469 11.0467 0.873326 11.0128 0.907254L3.44314 8.4769C3.41635 8.50368 3.40028 8.53583 3.39314 8.57154L2.86635 11.5751C2.84898 11.6708 2.85519 11.7692 2.88443 11.862C2.91368 11.9547 2.96509 12.0389 3.03421 12.1073C3.15207 12.2215 3.30028 12.284 3.45921 12.284ZM4.66278 9.16975L11.1396 2.69475L12.4485 4.00368L5.97171 10.4787L4.38421 10.759L4.66278 9.16975ZM14.5717 13.784H1.42885C1.11278 13.784 0.857422 14.0394 0.857422 14.3555V14.9983C0.857422 15.0769 0.921708 15.1412 1.00028 15.1412H15.0003C15.0789 15.1412 15.1431 15.0769 15.1431 14.9983V14.3555C15.1431 14.0394 14.8878 13.784 14.5717 13.784Z"
                    fill="#6366F1"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_2222_57368">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex items-center">
            {StepperFixtures.map((item, i) => (
              <React.Fragment key={i}>
                <div className="px-5 cursor-pointer">
                  <div
                    className={`py-[18px] font-inter text-[14px] leading-[24px] font-normal select-none ${
                      pageIndex === i
                        ? "border-b-[4px] border-[#6366F1] text-[#6366F1] !font-semibold"
                        : pageIndex < i
                        ? "text-[#9CA3AF]"
                        : "text-[#111827] cursor-pointer"
                    }`}
                    onClick={() => {
                      setPageIndex(i);
                    }}
                  >
                    <div className={`flex gap-[10px] items-center`}>
                      <div>{item.icon}</div>
                      <div>{stepperNames?.[i] ?? item.text}</div>
                    </div>
                  </div>
                </div>
                {i !== StepperFixtures.length - 1 && (
                  <svg
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={
                      i >= pageIndex ? "text-[#D1D5DB]" : "text-[#000000D9]"
                    }
                  >
                    <path
                      d="M13.0304 7.55042L4.98036 1.26292C4.95932 1.24636 4.93404 1.23607 4.90742 1.23323C4.8808 1.23038 4.85392 1.23511 4.82987 1.24686C4.80581 1.25861 4.78556 1.2769 4.77143 1.29964C4.7573 1.32238 4.74987 1.34865 4.75 1.37542V2.75578C4.75 2.84328 4.79107 2.9272 4.85893 2.98078L11.2875 8.00042L4.85893 13.0201C4.78929 13.0736 4.75 13.1576 4.75 13.2451V14.6254C4.75 14.7451 4.8875 14.8111 4.98036 14.7379L13.0304 8.45042C13.0988 8.39705 13.1541 8.32878 13.1922 8.2508C13.2303 8.17282 13.2501 8.08719 13.2501 8.00042C13.2501 7.91364 13.2303 7.82801 13.1922 7.75004C13.1541 7.67206 13.0988 7.60379 13.0304 7.55042Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <div
        className={`flex ${
          templateInlineCreation &&
          !templateInlineCreation.templateId &&
          isInlineCreator &&
          "w-full justify-end"
        }`}
      >
        {isInlineCreator && handleBackToJourney && (
          <Button
            type={ButtonType.SECONDARY}
            className="!text-[#111827] !border-[#E5E7EB] mr-[10px]"
            onClick={handleBackToJourney}
          >
            Back to journey
          </Button>
        )}
        {(!isInlineCreator || templateInlineCreation?.templateId) && (
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              if (pageIndex) {
                (isInlineCreator && handleBackToJourney
                  ? handleBackToJourney
                  : onSave)();
              } else setPageIndex(1);
            }}
            disabled={isSaving}
          >
            {pageIndex ? "Save" : "Next"}
          </Button>
        )}
      </div>

      <PushBuilderRenameModal
        initName={templateName}
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onSave={(newName) => {
          onSave(newName);
        }}
      />
    </div>
  );
};
