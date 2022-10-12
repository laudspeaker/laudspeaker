import { Chip, Menu, MenuItem } from "@mui/material";
import React, { FC, useState } from "react";

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
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(undefined);
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
        {possibleAttributes.map((attribute) => (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleValueReplace(`{{${tagContent}}}`, `{{${attribute}}}`);
              handleClose();
            }}
          >
            {attribute}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default MergeTagPicker;
