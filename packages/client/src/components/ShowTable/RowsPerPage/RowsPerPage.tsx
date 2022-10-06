import React from "react";
import { Box } from "@mui/material";

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
    <Box
      sx={{
        display: "flex",
        background: "#fff",
      }}
    >
      {rowData.map((item) => (
        <Box
          sx={{
            fontSize: "14px",
            border: "1px solid #E5E5E5",
            padding: "5px 17px",
            "&:last-child": {
              borderRadius: "0px 6px 6px 0px",
            },
            "&:first-of-type": {
              borderRadius: "6px 0px 0px 6px",
            },
            "&:hover": {
              backgroundColor: "#E5E5E5",
            },
            "&:active": backgroundStyle,
            // "&:active": {
            //   background:
            //     "linear-gradient(96.63deg, #6BCDB5 10.79%, #307179 67.24%, #122F5C 87.43%)",
            //   "-webkitBackgroundClip": "text",
            //   "-webkitTextFillColor": "transparent",
            // },
          }}
          onClick={(event) => handleRowClick(event)}
          key={item}
        >
          {item}
        </Box>
      ))}
    </Box>
  );
};

export default RowsPerPage;
