import * as React from "react";
import { styled } from "@mui/material/styles";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import RightTick from "../../../assets/images/RightTick.svg";
import CrossButton from "../../../assets/images/CrossButton.svg";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 44,
  height: 24,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    margin: "-12px 2px",
    padding: 0,
    transform: "translateX(4px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url(${RightTick})`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#223343",
        borderRadius: "12px",
      },
    },
    "& + .MuiSwitch-track": {
      borderRadius: 12,
      backgroundColor: "#E5E7EB",
      opacity: 1,
    },
  },
  "& .MuiSwitch-thumb": {
    width: 0,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "24px",
      height: "24px",
      left: "-5px",
      top: "12px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url(${CrossButton})`,
      backgroundSize: "cover",
    },
  },
}));

export default function ToggleSwitch({ checked, onChange }: any) {
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <MaterialUISwitch
            sx={{ m: 1 }}
            checked={checked}
            onChange={onChange}
          />
        }
        label={undefined}
      />
    </FormGroup>
  );
}
