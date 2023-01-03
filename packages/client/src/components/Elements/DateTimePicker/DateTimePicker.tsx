import Stack from "@mui/material/Stack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

interface IDateTimePickerProps {
  sx?: any;
  value: string;
  handleChange: any;
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
}: IDateTimePickerProps) {
  const onChange = (e: any) => {
    if (disabled) return;

    handleChange(e.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
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
