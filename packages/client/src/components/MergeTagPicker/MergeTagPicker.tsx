import {
  Box,
  Chip,
  FormControl,
  Input,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import React, { ChangeEvent, FC, useState } from "react";

interface MergeTagPickerProps {
  tagContent: string;
  possibleAttributes: string[];
  handleValueReplace: (regExp: RegExp | string, str: string) => void;
}

const MergeTagPicker: FC<MergeTagPickerProps> = ({
  tagContent,
  possibleAttributes,
  handleValueReplace,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [searchStr, setSearchStr] = useState("");
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    setSearchStr(e.target.value);
  };

  return (
    <>
      <span onClick={handleClick}>
        <Chip
          color="success"
          label={tagContent}
          sx={{ cursor: "pointer", userSelect: "none" }}
        />
      </span>
      <Menu
        id="merge-tag-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <Box
          sx={{
            padding: "20px 15px",
          }}
        >
          <FormControl
            sx={{
              marginBottom: "2.5px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "30px",
                marginLeft: "5px",
                color: "#223343",
              }}
            >
              Search for Customer Properties
            </Typography>
            <Input
              id="merge-tag-filter-input"
              name="merge-tag-filter-input"
              value={searchStr}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              inputProps={{
                style: {
                  background: "#E5E5E5",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "30px",
                  minWidth: "280px",
                  minHeight: "23px",
                },
              }}
            />
          </FormControl>
          <Box
            sx={{
              overflowY: "scroll",
              maxHeight: "260px",
            }}
          >
            {possibleAttributes
              .filter((str) => str.replace(" ", "").startsWith(searchStr))
              .map((attribute, index) => (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValueReplace(`{{${tagContent}}}`, `{{${attribute}}}`);
                    handleClose();
                  }}
                  sx={{
                    minWidth: "338px",
                    height: "63px",
                    border: "1px solid #F3F3F3",
                    borderRadius: "5px",
                    fontFamily: "Inter",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "24px",
                    margin: "2.5px 0",
                    padding: "5px",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                  }}
                  key={index}
                >
                  <Box>{attribute}</Box>
                </MenuItem>
              ))}
          </Box>
        </Box>
      </Menu>
    </>
  );
};

export default MergeTagPicker;
