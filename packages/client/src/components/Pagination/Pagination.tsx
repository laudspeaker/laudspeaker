import React, { FC } from "react";
import chevronLeftImage from "./svg/chevron-left.svg";
import chevronRightImage from "./svg/chevron-right.svg";

interface PaginationProps {
  currentPage: number;
  setCurrentPage: (currentPage: number) => void;
  totalPages: number;
}

const firstStickyElementsCount = 2;
const lastStickyElementsCount = 3;

const Pagination: FC<PaginationProps> = ({
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  const showDotsBefore = currentPage > firstStickyElementsCount + 2;
  const showDotsAfter = currentPage + 2 < totalPages - lastStickyElementsCount;

  return (
    <div className="flex border border-[#E5E7EB] rounded-md w-fit">
      <button
        className="p-2 border-r-[1px] border-[#E5E7EB]"
        onClick={() => currentPage !== 1 && setCurrentPage(currentPage - 1)}
      >
        <img className="w-[20px] h-[20px]" src={chevronLeftImage} />
      </button>
      {new Array(totalPages).fill(0, 0, totalPages).map((_, i) => (
        <React.Fragment key={i}>
          {i + 1 === currentPage - 1 && showDotsBefore && (
            <div className="px-[16px] py-2 border-r-[1px] border-[#E5E7EB]">
              ...
            </div>
          )}

          {(i < firstStickyElementsCount ||
            i >= totalPages - lastStickyElementsCount ||
            (i + 2 >= currentPage && i <= currentPage)) && (
            <button
              className={`px-[16px] py-2 border-r-[1px] border-[#E5E7EB] ${
                i + 1 === currentPage ? "bg-[#6366F1] text-white" : ""
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          )}

          {i + 1 === currentPage + 1 && showDotsAfter && (
            <div className="px-[16px] py-2 select-none border-r-[1px] border-[#E5E7EB]">
              ...
            </div>
          )}
        </React.Fragment>
      ))}
      <button
        className="p-2"
        onClick={() =>
          currentPage !== totalPages && setCurrentPage(currentPage + 1)
        }
      >
        <img className="w-[20px] h-[20px]" src={chevronRightImage} />
      </button>
    </div>
  );
};

export default Pagination;
