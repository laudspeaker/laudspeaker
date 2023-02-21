import Stack from "@mui/material/Stack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ChangeEvent } from "react";

interface IDateTimePickerProps {
  sx?: object;
  value: string;
  handleChange: (val: string) => void;
  label?: string;
  inputStyle?: object;
  disabled?: boolean;
  dateStyle?: "short" | "medium" | "full" | "long";
  timeStyle?: "short" | "medium" | "full" | "long";
}

export default function DateTimePicker({
  handleChange,
  value,
  disabled = false,
  label,
}: IDateTimePickerProps) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    handleChange(e.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          disabled={!!disabled}
          value={value}
          type="datetime-local"
          onChange={onChange}
        />
      </Stack>
    </LocalizationProvider>
  );
}
