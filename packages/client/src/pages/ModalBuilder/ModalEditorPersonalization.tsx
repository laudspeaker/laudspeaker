import { CircularProgress } from "@mui/material";
import Progress from "components/Progress";
import { getCustomerKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useState } from "react";
import { useDebounce } from "react-use";
import { IAdditionalActionData, PreviousModes } from "./ModalEditor";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { ModalState, SubMenuOptions } from "./types";

interface ModalEditorPersonalizationProps {
  modalState: ModalState;
  previousModes: PreviousModes;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
}

const ModalEditorPersonalization: FC<ModalEditorPersonalizationProps> = ({
  actionData,
  currentMainMode,
  modalState,
  onOptionPick,
  previousModes,
  setModalState,
}) => {
  const [searchStr, setSeatchStr] = useState("");
  const [fetchedCustomerKeys, setFetchedCustomerKeys] = useState<
    { key: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // const fetchKeys = async () => {
  //   setIsLoading(true);
  //   const data = await getCustomerKeys(searchStr, null, false);
  //   setFetchedCustomerKeys(data);
  //   setIsLoading(false);
  // };

  // useDebounce(fetchKeys, 200, [searchStr]);

  return (
    <div className="p-5">
      <div className="w-full relative mb-[20px]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-1/2 left-[10px] -translate-y-1/2"
        >
          <path
            d="M13.2125 12.3535L9.15469 8.2957C9.78438 7.48164 10.125 6.48633 10.125 5.43945C10.125 4.18633 9.63594 3.01133 8.75156 2.12539C7.86719 1.23945 6.68906 0.751953 5.4375 0.751953C4.18594 0.751953 3.00781 1.24102 2.12344 2.12539C1.2375 3.00977 0.75 4.18633 0.75 5.43945C0.75 6.69102 1.23906 7.86914 2.12344 8.75352C3.00781 9.63945 4.18438 10.127 5.4375 10.127C6.48438 10.127 7.47813 9.78633 8.29219 9.1582L12.35 13.2145C12.3619 13.2264 12.376 13.2358 12.3916 13.2422C12.4071 13.2487 12.4238 13.252 12.4406 13.252C12.4575 13.252 12.4741 13.2487 12.4897 13.2422C12.5052 13.2358 12.5194 13.2264 12.5312 13.2145L13.2125 12.5348C13.2244 12.5229 13.2338 12.5087 13.2403 12.4932C13.2467 12.4776 13.2501 12.461 13.2501 12.4441C13.2501 12.4273 13.2467 12.4106 13.2403 12.3951C13.2338 12.3795 13.2244 12.3654 13.2125 12.3535ZM7.9125 7.91445C7.25 8.57539 6.37187 8.93945 5.4375 8.93945C4.50312 8.93945 3.625 8.57539 2.9625 7.91445C2.30156 7.25195 1.9375 6.37383 1.9375 5.43945C1.9375 4.50508 2.30156 3.62539 2.9625 2.96445C3.625 2.30352 4.50312 1.93945 5.4375 1.93945C6.37187 1.93945 7.25156 2.30195 7.9125 2.96445C8.57344 3.62695 8.9375 4.50508 8.9375 5.43945C8.9375 6.37383 8.57344 7.25352 7.9125 7.91445Z"
            fill="#9CA3AF"
          />
        </svg>
        <input
          type="text"
          value={searchStr}
          onChange={(e) => setSeatchStr(e.target.value)}
          className="w-full bg-white border border-[#E5E7EB] focus:border-[#6366F1] text-[14px] leading-[22px] font-normal py-[5px] px-[28px]"
          placeholder="search variables"
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute top-1/2 right-[10px] -translate-y-1/2 cursor-pointer ${
            searchStr ? "" : "hidden"
          }`}
          onClick={() => setSeatchStr("")}
        >
          <path
            d="M8 0.125C3.65117 0.125 0.125 3.65117 0.125 8C0.125 12.3488 3.65117 15.875 8 15.875C12.3488 15.875 15.875 12.3488 15.875 8C15.875 3.65117 12.3488 0.125 8 0.125ZM10.9074 10.9918L9.74727 10.9865L8 8.90352L6.25449 10.9848L5.09258 10.99C5.01523 10.99 4.95195 10.9285 4.95195 10.8494C4.95195 10.816 4.96426 10.7844 4.98535 10.758L7.27227 8.0334L4.98535 5.31055C4.96411 5.28478 4.95233 5.25253 4.95195 5.21914C4.95195 5.1418 5.01523 5.07852 5.09258 5.07852L6.25449 5.08379L8 7.1668L9.74551 5.08555L10.9057 5.08027C10.983 5.08027 11.0463 5.1418 11.0463 5.2209C11.0463 5.2543 11.034 5.28594 11.0129 5.3123L8.72949 8.03516L11.0146 10.7598C11.0357 10.7861 11.048 10.8178 11.048 10.8512C11.048 10.9285 10.9848 10.9918 10.9074 10.9918Z"
            fill="#4B5563"
          />
        </svg>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center">
          <CircularProgress
            size={30}
            sx={{
              color: "#4B5563",
            }}
          />
        </div>
      ) : fetchedCustomerKeys.length > 0 ? (
        <div className="select-none">
          {fetchedCustomerKeys.map((item) => (
            <div
              className="cursor-pointer w-full h-[40px] bg-white hover:!bg-[#E0E7FF] p-[10px] !text-[14px]"
              onClick={() => {
                if (currentMainMode === EditorMenuOptions.BODY) {
                  setModalState({
                    ...modalState,
                    body: {
                      ...modalState.body,
                      content: modalState.body.content + `{{ ${item.key} }}`,
                    },
                  });
                } else {
                  setModalState({
                    ...modalState,
                    title: {
                      ...modalState.title,
                      content: modalState.title.content + `{{ ${item.key} }}`,
                    },
                  });
                }
              }}
            >
              {item.key}
            </div>
          ))}
        </div>
      ) : searchStr ? (
        <div className="w-full flex justify-center items-center text-[#4B5563] text-[14px] font-normal">
          No results for "{searchStr}"
        </div>
      ) : (
        <div className="w-full flex flex-col justify-center items-center text-[#4B5563] text-[14px] font-normal">
          <div>No variable defined</div>
          <div>Please define one in [xxx] to continue.</div>
        </div>
      )}
    </div>
  );
};

export default ModalEditorPersonalization;
