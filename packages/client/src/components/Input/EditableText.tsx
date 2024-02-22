import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { Input } from "components/Elements";
import { ChangeEvent, FocusEventHandler, KeyboardEvent, useState } from "react";

type Props = {
  onChange: (text: string) => void;
  value: string;
};

export const EditableText = ({ value, onChange }: Props) => {
  const [draftValue, setDraftValue] = useState(value);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftValue(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onChange(draftValue);
      setIsEditMode(false);
    }
  };

  const handleBlur: FocusEventHandler = () => {
    setIsEditMode(false);
  };

  return (
    <div className="w-[120px]">
      {isEditMode ? (
        <Input
          value={draftValue}
          placeholder={"Enter text"}
          name="title"
          id="title"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className="text-sm p-0"
        />
      ) : (
        <div className="flex items-center gap-[10px]">
          <div className="text-sm">{value}</div>
          <div
            className="text-[16px] text-[#6366F1] cursor-pointer p-0"
            onClick={() => setIsEditMode(true)}
          >
            <BorderColorOutlinedIcon fontSize="inherit" />
          </div>
        </div>
      )}
    </div>
  );
};
