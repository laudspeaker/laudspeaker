import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  Tooltip,
  MenuItem,
} from "@mui/material";
import Card from "components/Cards/Card";
import { GenericButton, Input, Select } from "components/Elements";
import { useNavigate } from "react-router-dom";

export interface INameSegmentForm {
  name: string;
  isPrimary: boolean;
}

const segmentTypeStyle = {
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  width: "234px",
  marginTop: "20px",
  padding: "15px",
};

interface INameSegment {
  onSubmit?: (e: any) => void;
  isPrimary: boolean;
}

const NamePerson = ({ onSubmit, isPrimary }: INameSegment) => {
  // A Segment initally has three Properties:
  //      1. Dynamic: whether new customers are added
  //         after a workflow is live
  //      2. Name, the name of the segment
  //      3. Description, the segment description
  const [segmentForm, setSegmentForm] = useState<INameSegmentForm>({
    name: "",
    isPrimary: isPrimary,
  });
  const [day, setDay] = useState("");
  const navigate = useNavigate();

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: any) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
  };

  const handleType = (e: any) => {
    setDay(e.target.value);
  };

  // Pushing state back up to the flow builder
  const handleSubmit: any = async (e: any) => {
    if (day == "slack") {
      const navigationLink = "/templates/slack/" + segmentForm.name;
      navigate(navigationLink);
    } else if (day == "email") {
      const navigationLink = "/templates/email/" + segmentForm.name;
      navigate(navigationLink);
    } else {
    }
    e.preventDefault();
    if (onSubmit) {
      onSubmit(segmentForm);
    }
  };

  return (
    <Box>
      <Box
        alignItems={"flex-start"}
        justifyContent={"center"}
        display={"flex"}
        paddingTop={"18px"}
        marginBottom="50px"
      >
        <Card
          sx={{
            padding: "22px 30px 77px 30px",
            width: "100%",
            maxWidth: "1138px",
          }}
        >
          <Typography variant="h3">Name your Person</Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={segmentForm.name}
                placeholder={"Enter name"}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={handleSegmentFormChange}
                labelShrink
                inputProps={{
                  style: {
                    padding: "15px 16px",
                    background: "#fff",
                    border: "1px solid #D1D5DB",
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "16px",
                  },
                }}
              />
            </FormControl>
            <FormControl
              sx={{
                padding: "0 15px",
                marginTop: "20px",
                width: "auto",
              }}
            >
              <Select
                id="handleDay"
                value={day}
                onChange={handleType}
                displayEmpty
                sx={{
                  height: "44px",
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    paddingRight: "50px !important",
                    boxShadow: "none",
                  },
                }}
              >
                {["email", "slack", "sms"].map((item) => (
                  <MenuItem value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Box display={"flex"} justifyContent="flex-end">
            <GenericButton
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              sx={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Create Person
            </GenericButton>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default NamePerson;
