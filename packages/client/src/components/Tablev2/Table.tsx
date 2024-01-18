import Progress from "components/Progress";
import React, { FC, ReactNode } from "react";

interface TableProps {
  headings?: ReactNode[];
  rows?: ReactNode[][];
  isLoading?: boolean;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
}

const Table: FC<TableProps> = ({
  headings,
  rows,
  isLoading,
  className = "",
  headClassName = "",
  bodyClassName = "",
}) => {
  return (
    <table className={`rounded ${className ? className : ""}`}>
      {headings && (
        <thead className={headClassName}>
          <tr className="border-b-[1px] border-[#E5E7EB] ">
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
          {isLoading && (
            <tr className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-75 flex items-center justify-center">
              <td>
                <Progress />
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b-[1px] border-[#E5E7EB] hover:bg-[#F3F4F6]"
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
