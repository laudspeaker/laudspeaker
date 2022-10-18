import { Menu } from "@mui/material";
import Chip from "components/Elements/Chip";
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
        <Chip label={tagContent} />
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
        <div className="py-[20px] px-[15px] outline-none">
          <form className="mb-[2.5px]">
            <p className="text-[#223343] font-[Poppins] font-normal leading-[30px] ml-[5px]">
              Search for Customer Properties
            </p>
            <input
              id="merge-tag-filter-input"
              name="merge-tag-filter-input"
              value={searchStr}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="!bg-[#E5E5E5] outline-none !rounded-[10px] !py-[12px] !px-[20px] font-[Poppins] not-italic font-normal text-[16px] leading-[30px]  min-w-[280px] min-h-[23px]"
            />
          </form>
          <div className="overflow-y-scroll max-h-[260px]">
            {possibleAttributes
              .filter((str) =>
                str
                  .replace(" ", "")
                  .toLowerCase()
                  .includes(searchStr.toLowerCase())
              )
              .map((attribute, index) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValueReplace(`{{${tagContent}}}`, `{{${attribute}}}`);
                    handleClose();
                  }}
                  className="min-w-[338px] h-[62px] border-[1px] border-[#F3F3F3] rounded-[5px] font-[Inter] font-medium not-italic text-[16px] leading-[24px]  my-[2.5px] mx-0 p-[5px]  flex justify-start items-start"
                  key={index}
                >
                  <div>{attribute}</div>
                </div>
              ))}
          </div>
        </div>
      </Menu>
    </>
  );
};

export default MergeTagPicker;
