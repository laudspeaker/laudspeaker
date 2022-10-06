import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker as DTP } from "@mui/x-date-pickers/DateTimePicker";

interface IDateTimePickerProps {
  sx?: any;
  value: Date;
  handleChange: any;
  label?: string;
  inputStyle?: object;
  dateStyle?: "short" | "medium" | "full" | "long";
  timeStyle?: "short" | "medium" | "full" | "long";
}

export default function DateTimePicker({
  handleChange,
  value,
  sx,
  label,
  inputStyle,
  dateStyle,
  timeStyle,
}: IDateTimePickerProps) {
  const onChange = (newValue: Date | null) => {
    handleChange(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        <DTP
          label={label || ""}
          value={value}
          onChange={onChange}
          renderInput={(params) => (
            <TextField
              value={value.toLocaleString(undefined, {
                dateStyle,
                timeStyle,
              })}
              {...params}
              sx={sx}
              inputProps={inputStyle}
            />
          )}
        />
      </Stack>
    </LocalizationProvider>
  );
}
