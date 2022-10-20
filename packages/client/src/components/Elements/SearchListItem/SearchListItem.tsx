import React from "react";
import EmailIcon from "../../../assets/images/EmailIcon.svg";

interface IListProp {
  title?: string;
}
const SearchListItem = (props: IListProp) => {
  const { title } = props;
  return (
    <div className="flex flex-col gap-[5px] my-[5px] mx-[15px] border-[1px] border-[#F3F3F3] p-[5px] rounded-[5px]">
      <div className="flex gap-[12px]">
        <img src={EmailIcon} />
        <p>{title}</p>
      </div>
      <div className="flex ml-[30px]">
        <p className="font-[Inter] font-normal text-[12px] leading-[24px]">
          Subtitle
        </p>
      </div>
    </div>
  );
};

export default SearchListItem;
