import React, { MouseEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Pagination,
  Divider,
} from "@mui/material";
import RowsPerPage from "./RowsPerPage";
import ApiService from "services/api.service";
import { ApiConfig } from "./../../constants";

function createData(
  journey: string,
  firstName: string,
  lastName: string,
  state: string,
  createdBy: string,
  createdOn: string
) {
  return { journey, firstName, lastName, state, createdBy, createdOn };
}

const rows = [
  createData("john@mail.com", "John", "sand", "wa", "seattle", "23 days ago"),
  createData("john1@mail.com", "John", "sand", "wa", "seattle", "23 days ago"),
  createData("john2@mail.com", "John", "sand", "wa", "seattle", "23 days ago"),
  createData("john3@mail.com", "John", "sand", "wa", "seattle", "23 days ago"),
  createData("john4@mail.com", "John", "sand", "wa", "seattle", "23 days ago"),
];
const styleText = {
  lineHeight: "30px",
  color: "#6B7280",
  // fontFamily: "Poppins",
};
const rowStyleText = {
  lineHeight: "30px",
  color: "#6B7280",
  // fontFamily: "Poppins",
  fontSize: "16px",
};

interface EnhancedTableProps {
  numSelected: number;
  // onRequestSort: (
  //   event: React.MouseEvent<unknown>,
  //   property: keyof Data
  // ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // order: Order;
  // orderBy?: string;
  rowCount: number;
  isSelected: (e: string) => boolean;
  handleClick: (event: React.MouseEvent<unknown>, name: string) => void;
}

function BasicTable(props: EnhancedTableProps) {
  const { onSelectAllClick, numSelected, rowCount, isSelected, handleClick } =
    props;
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 550 }} aria-label="simple table">
        <TableHead sx={{ height: "45px" }}>
          <TableRow sx={{ background: "#E5E5E5" }}>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={numSelected > 0 && numSelected < rowCount}
                checked={rowCount > 0 && numSelected === rowCount}
                onChange={onSelectAllClick}
                inputProps={{
                  "aria-label": "select all desserts",
                }}
              />
            </TableCell>
            <TableCell sx={styleText}>Journey</TableCell>
            <TableCell sx={styleText}>First Name</TableCell>
            <TableCell sx={styleText}>LastName</TableCell>
            <TableCell sx={styleText}>State</TableCell>
            <TableCell sx={styleText}>Created By</TableCell>
            <TableCell sx={styleText}>Created On</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const isItemSelected = isSelected(row.journey);
            const labelId = `enhanced-table-checkbox-${index}`;
            return (
              <TableRow
                key={row.journey}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                onClick={(event) => handleClick(event, row.journey)}
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                selected={isItemSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={isItemSelected}
                    inputProps={{
                      "aria-labelledby": labelId,
                    }}
                  />
                </TableCell>

                <TableCell sx={rowStyleText}>{row.journey}</TableCell>
                <TableCell sx={rowStyleText}>{row.firstName}</TableCell>
                <TableCell sx={rowStyleText}>{row.lastName}</TableCell>
                <TableCell sx={rowStyleText}>{row.state}</TableCell>
                <TableCell sx={rowStyleText}>{row.createdBy}</TableCell>
                <TableCell sx={rowStyleText}>{row.createdOn}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const ShowTable = () => {
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(1);
  // const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const isSelected = (name: string) => selected.indexOf(name) !== -1;
  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.journey);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const changePage = (
    event: React.ChangeEvent<unknown>,
    pageNumber: number
  ) => {
    setPage(pageNumber);
  };

  const handleRowClick = (event: MouseEvent<HTMLDivElement>) => {
    // setRowsPerPage(event.target.innerText);
  };

  const getAllJourneysData = async () => {
    await ApiService.get({
      url: `${ApiConfig.flow}`,
    });
  };

  getAllJourneysData();

  React.useEffect(() => {}, [rowsPerPage]);

  return (
    <div className="py-[0px] px-[40px]">
      <BasicTable
        numSelected={selected.length || 0}
        // order={order}
        // orderBy={orderBy}
        isSelected={isSelected}
        handleClick={handleClick}
        onSelectAllClick={handleSelectAllClick}
        rowCount={rows.length || 0}
      />
      <Divider sx={{ marginTop: "40px" }} />
      <div className="flex justify-between py-[10px] px-[0px]">
        <Pagination
          count={10}
          page={page}
          onChange={changePage}
          sx={{
            "& .MuiPagination-ul": {
              li: {
                button: {
                  borderRadius: "0",
                  "& .MuiButtonBase-root-MuiPaginationItem-root.Mui-selected": {
                    backgroundColor: "transparent",
                    borderRadius: "0",
                    borderTop: "red 2px solid",
                    background: "none",
                  },
                },
              },
            },
          }}
        />
        <RowsPerPage
          rowsPerPage={rowsPerPage}
          handleRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default ShowTable;
