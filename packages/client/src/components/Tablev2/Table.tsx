import React, { FC, ReactNode } from "react";

interface TableProps {
  headings?: ReactNode[];
  rows?: ReactNode[][];
}

const Table: FC<TableProps> = ({ headings, rows }) => {
  return (
    <table className="rounded-[4px] overflow-hidden">
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
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b-[1px] border-[#E5E7EB]">
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
