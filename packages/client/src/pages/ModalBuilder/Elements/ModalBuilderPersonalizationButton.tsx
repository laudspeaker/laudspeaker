import React, { FC } from "react";

interface ModalBuilderPersonalizationButtonProps {
  onClick: () => void;
}

const ModalBuilderPersonalizationButton: FC<
  ModalBuilderPersonalizationButtonProps
> = ({ onClick }) => {
  return (
    <div
      className="flex justify-between items-center p-[4px_12px] w-[180px] h-[32px] rounded-md bg-white border-[#E5E7EB] border float-left cursor-pointer"
      onClick={onClick}
    >
      <div>Insert variable</div>
      <svg
        width="7"
        height="12"
        viewBox="0 0 7 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.39777 5.66281L0.360269 0.947189C0.344493 0.934768 0.325533 0.92705 0.305568 0.924919C0.285603 0.922788 0.265441 0.926332 0.247399 0.935143C0.229357 0.943955 0.214166 0.957676 0.203571 0.974732C0.192976 0.991787 0.187406 1.01149 0.187501 1.03156V2.06683C0.187501 2.13246 0.218305 2.1954 0.269198 2.23558L5.09063 6.00031L0.269198 9.76505C0.216966 9.80522 0.187501 9.86817 0.187501 9.9338V10.9691C0.187501 11.0588 0.290626 11.1083 0.360269 11.0534L6.39777 6.33781C6.44908 6.29779 6.4906 6.24658 6.51915 6.1881C6.5477 6.12962 6.56254 6.06539 6.56254 6.00031C6.56254 5.93523 6.5477 5.87101 6.51915 5.81253C6.4906 5.75404 6.44908 5.70284 6.39777 5.66281Z"
          fill="#4B5563"
        />
      </svg>
    </div>
  );
};

export default ModalBuilderPersonalizationButton;
