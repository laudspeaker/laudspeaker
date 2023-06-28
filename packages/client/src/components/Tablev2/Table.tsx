import Progress from "components/Progress";
import React, { FC, ReactNode } from "react";

interface TableProps {
  headings?: ReactNode[];
  rows?: ReactNode[][];
  isLoading?: boolean;
}

const Table: FC<TableProps> = ({ headings, rows, isLoading }) => {
  return (
    <table className="rounded-[4px]">
      {headings && (
        <thead>
          <tr className="bg-[#F3F4F6] border-b-[1px] border-[#E5E7EB] ">
            {headings.map((heading, i) => (
              <th className="px-[20px] py-[10px] text-left" key={i}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
      )}

      {rows && (
        <tbody className="relative">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-75 flex items-center justify-center">
              <Progress />
            </div>
          )}
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b-[1px] border-[#E5E7EB] hover:bg-[#F3F4F6]"
            >
              {row.map((el, j) => (
                <td className="px-[20px] py-[10px]" key={j}>
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
