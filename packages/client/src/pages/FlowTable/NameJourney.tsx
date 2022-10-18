import { useState } from "react";
import { Box, Typography, Grid, FormControl, Tooltip } from "@mui/material";
import Card from "components/Cards/Card";
import { GenericButton, Input } from "components/Elements";
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

const NameJourney = ({ onSubmit, isPrimary }: INameSegment) => {
  // A Segment initally has three Properties:
  //      1. Dynamic: whether new customers are added
  //         after a workflow is live
  //      2. Name, the name of the segment
  //      3. Description, the segment description
  const [segmentForm, setSegmentForm] = useState<INameSegmentForm>({
    name: "",
    isPrimary: isPrimary,
  });
  const navigate = useNavigate();

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: any) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
  };

  // Pushing state back up to the flow builder
  const handleSubmit: any = async (e: any) => {
    const navigationLink = "/flow/" + segmentForm.name;
    navigate(navigationLink);
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
          <Typography variant="h3">Name your Journey</Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={segmentForm.name}
                placeholder={"Enter name"}
                name="name"
                id="name"
                style={{
                  width: "530px",
                  padding: "15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
                onChange={handleSegmentFormChange}
              />
            </FormControl>
          </Grid>
          <Box data-createbox="true" display={"flex"} justifyContent="flex-end">
            <GenericButton
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Create
            </GenericButton>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default NameJourney;
