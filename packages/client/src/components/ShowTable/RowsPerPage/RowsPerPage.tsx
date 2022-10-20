import React from "react";

interface IRowNumberProps {
  rowsPerPage: number;
  handleRowClick: (event: React.MouseEvent<unknown>) => void;
}
const RowsPerPage = (props: IRowNumberProps) => {
  const { handleRowClick, rowsPerPage } = props;
  const rowData = [10, 20, 50, 80, 100];

  const backgroundStyle = {
    background:
      "linear-gradient(96.63deg, #6BCDB5 10.79%, #307179 67.24%, #122F5C 87.43%)",
    "-webkitBackgroundClip": "text",
    "-webkitTextFillColor": "transparent",
    border:
      "2px solid linear-gradient(96.63deg, #6BCDB5 10.79%, #307179 67.24%, #122F5C 87.43%)",
  };

  return (
    <div className="flex bg-white">
      {rowData.map((item) => (
        <div
          className="text-[14px] border-[1px] border-[#E5E5E5] py-[5px] px-[17px] last:rounded-[0px_6px_6px_0px] first-of-type:rounded-[0px_6px_6px_0px] hover:bg-[#E5E5E5]"
          style={{
            // @ts-ignore
            "&:active": backgroundStyle,
          }}
          onClick={(event) => handleRowClick(event)}
          key={item}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default RowsPerPage;
