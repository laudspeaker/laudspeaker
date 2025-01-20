import Progress from "components/Progress";
import React, { FC, ReactNode } from "react";

interface TableProps<T> {
  headings?: ReactNode[];
  rowsData: T[];
  rows?: ReactNode[][];
  isLoading?: boolean;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
  selectedRow?: number;
  onRowClick?: (i: number) => void;
  trHeadingClassName?: string;
  rowClassName?: string;
}

const Table = <T,>({
  headings,
  rowsData,
  rows,
  isLoading,
  className = "",
  headClassName = "",
  bodyClassName = "",
  selectedRow,
  trHeadingClassName = "",
  onRowClick,
  rowClassName = "",
}: TableProps<T>) => {
  if (isLoading) {
    return (
      <table className={`rounded ${className ? className : ""}`}>
        <tr>
          <td colSpan={headings?.length || 1}>
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex space-x-4">
                  {Array.from({ length: 3 }).map((arr, idx) => (
                    <div
                      key={idx}
                      className="h-4 bg-gray-200 rounded w-full"
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </td>
        </tr>
      </table>
    );
  }

  return (
    <table className={`rounded ${className ? className : ""}`}>
      {headings && (
        <thead className={headClassName}>
          <tr
            className={`${trHeadingClassName} border-b-[1px] border-[#E5E7EB]`}
          >
            {headings.map((heading, i) => (
              <th className="text-left" key={i}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
      )}

      {rows && (
        <tbody className={`relative ${bodyClassName}`}>
          {rows?.map((row, i) => (
            <tr
              key={i}
              className={`border-b-[1px] border-[#E5E7EB] hover:bg-[#F3F4F6] ${
                onRowClick ? "cursor-pointer" : ""
              } ${
                i === selectedRow ? "!bg-[#6366F1] !text-white" : ""
              } ${rowClassName}`}
              onClick={() => onRowClick?.(i)}
            >
              {row.map((el, j) => (
                <td className="px-5 py-[10px]" key={j}>
                  {el}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )}
    </table>
  );
};

export default Table;
