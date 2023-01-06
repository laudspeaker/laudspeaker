import { ChangeEvent, FormEvent } from "react";
import { Resource } from "../EmailBuilder";

interface IMergeTagPickerProps {
  options: Resource[];
  onClick: (str: string) => void;
}

interface IGenerateOptionsProps {
  optionWrapper: HTMLDivElement;
  options: Resource[];
  filterText?: string;
  onClick: (str: string) => void;
}

const generateOptions = ({
  optionWrapper,
  options,
  filterText,
  onClick,
}: IGenerateOptionsProps) => {
  optionWrapper.innerHTML = "";

  options.forEach((el) => {
    if (
      !(
        (filterText &&
          el.id.toLocaleLowerCase().includes(filterText.toLocaleLowerCase())) ||
        !filterText
      )
    )
      return;

    const option = document.createElement("div");
    option.setAttribute(
      "style",
      `
        margin-bottom: 5px  !important; height: 62px  !important; border-radius: 5px  !important; border: 1px solid #F3F3F3  !important; color: black  !important; padding: 6px  !important; font-size: 16px !important; font-family: 'Inter' !important; font-style: normal !important; font-weight: 500 !important;
      `
    );
    option.setAttribute("contenteditable", "false");
    option.innerHTML = el.id;
    option.addEventListener("click", () => onClick(el.id));

    optionWrapper.appendChild(option);
  });
};

const generateTagPicker = ({
  options,
  onClick,
}: IMergeTagPickerProps): Node => {
  const mainDiv = document.createElement("div");
  const label = document.createElement("div");
  const input = document.createElement("input");
  const optionWrapper = document.createElement("div");

  mainDiv.setAttribute(
    "style",
    `
      position: absolute !important;
      z-index: 99999 !important;
      top: 100% !important;
      left: 0 !important;
      min-width: 340px !important;
      max-width: 340px !important;
      max-height: 368px !important;
      background: white !important;
      border: 1px solid #F3F3F3 !important;
      box-shadow: 0px 6px 40px -19px rgba(0, 0, 0, 0.25) !important;
      border-radius: 15px !important;
      padding: 25px 15px !important;
    `
  );
  mainDiv.setAttribute("contenteditable", "false");

  label.setAttribute(
    "style",
    `
      font-family: Poppins !important;
      font-style: normal !important;
      font-weight: 400 !important;
      font-size: 16px !important;
      line-height: 30px !important;
      color: #223343 !important;
    `
  );
  label.setAttribute("contenteditable", "false");

  input.setAttribute(
    "style",
    `
      width: 100% !important;
      padding: 13px 20px !important;
      background: #E5E5E5 !important;
      color: #6B7280 !important;
      border-radius: 10px !important;
      border: 0 !important;
      margin-bottom: 5px !important;
      outline: none !important;
    `
  );
  input.setAttribute("placeholder", "Name");

  optionWrapper.setAttribute(
    "style",
    `
    overflow-y: scroll !important;
    max-height: 266px !important;
  `
  );

  label.innerHTML = "Search for Customer Properties";

  mainDiv.appendChild(label);
  mainDiv.appendChild(input);
  mainDiv.appendChild(optionWrapper);
  generateOptions({
    optionWrapper,
    options,
    onClick,
  });

  input.addEventListener("input", (ev: any) =>
    generateOptions({
      optionWrapper,
      options,
      onClick,
      filterText: ev.currentTarget?.value,
    })
  );

  return mainDiv;
};

export default generateTagPicker;
