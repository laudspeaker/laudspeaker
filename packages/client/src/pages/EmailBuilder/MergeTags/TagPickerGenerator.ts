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
        margin-bottom: 5px  !important; height: 62px  !important; border-radius: 5px  !important; border: 1px solid #F3F3F3  !important; color: black  !important; padding: 6px  !important; font-size: 16px; font-family: 'Inter'; font-style: normal; font-weight: 500;
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
      position: absolute;
      z-index: 99999;
      top: 100%;
      left: 0;
      min-width: 340px;
      max-width: 340px;
      max-height: 368px;
      background: white;
      border: 1px solid #F3F3F3;
      box-shadow: 0px 6px 40px -19px rgba(0, 0, 0, 0.25);
      border-radius: 15px;
      padding: 25px 15px;
    `
  );
  mainDiv.setAttribute("contenteditable", "false");

  label.setAttribute(
    "style",
    `
      font-family: Poppins;
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 30px;
      color: #223343;
    `
  );
  label.setAttribute("contenteditable", "false");

  input.setAttribute(
    "style",
    `
      width: 100%;
      padding: 13px 20px;
      background: #E5E5E5;
      color: #6B7280;
      border-radius: 10px;
      border: 0;
      margin-bottom: 5px;
      outline: none;
    `
  );
  input.setAttribute("placeholder", "Name");

  optionWrapper.setAttribute(
    "style",
    `
    overflow-y: scroll;
    max-height: 266px;
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
      filterText: ev.currentTarget.value,
    })
  );

  return mainDiv;
};

export default generateTagPicker;
