import { useState } from "react";
import { Box, Typography, Grid, FormControl, Tooltip } from "@mui/material";
import Card from "components/Cards/Card";
import { GenericButton, Input } from "components/Elements";
import InfoIcon from "assets/images/info.svg";
import ToggleSwitch from "./../../components/Elements/ToggleSwitch";

export interface INameSegmentForm {
  name: string;
  description: string;
  isDynamic: boolean;
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
  isCollapsible: boolean;
  onClose: () => void;
}

const NameSegment = ({
  onSubmit,
  isPrimary,
  onClose,
  isCollapsible,
}: INameSegment) => {
  // A Segment initally has three Properties:
  //      1. Dynamic: whether new customers are added
  //         after a workflow is live
  //      2. Name, the name of the segment
  //      3. Description, the segment description
  const [segmentForm, setSegmentForm] = useState<INameSegmentForm>({
    isDynamic: true,
    name: "",
    description: "",
    isPrimary: isPrimary,
  });

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: any) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
    if (e.target.name === "description") {
      setSegmentForm({ ...segmentForm, description: e.target.value });
    }
  };

  // Handling Dynamic toggle
  const onToggleChange = () => {
    setSegmentForm({ ...segmentForm, isDynamic: !segmentForm.isDynamic });
  };

  // Pushing state back up to the flow builder
  const handleSubmit: any = async (e: any) => {
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
            position: "relative",
          }}
        >
          {isCollapsible && (
            <button
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                border: "0px",
                background: "transparent",
                outline: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
              onClick={onClose}
            >
              x
            </button>
          )}
          <Typography variant="h3">Name your segment</Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                label="Name"
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
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                label="Description"
                value={segmentForm.description}
                placeholder={"Add an optional description of your segment..."}
                name="description"
                id="description"
                onChange={handleSegmentFormChange}
                style={{
                  padding: "15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
              />
            </FormControl>
          </Grid>
          {isPrimary && (
            <div>
              <Typography variant="h3" paddingTop={"20px"}>
                Choose a segment type
              </Typography>
              <Box sx={segmentTypeStyle}>
                <Grid
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body1" fontWeight={600} color="#111827">
                    Dynamic
                  </Typography>
                  <ToggleSwitch
                    checked={segmentForm.isDynamic}
                    onChange={onToggleChange}
                  />
                </Grid>
                <Tooltip title="dynamic">
                  {/* <IconButton> */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "end",
                      cursor: "default",
                    }}
                    marginTop="8px"
                  >
                    <img src={InfoIcon} width="20px" />
                    <Typography
                      variant="subtitle2"
                      color="#4FA198"
                      fontSize={"12px"}
                      paddingLeft="5px"
                    >
                      What is a dynamic segment?
                    </Typography>
                  </Box>
                  {/* </IconButton> */}
                </Tooltip>
              </Box>
            </div>
          )}
          <Box data-namesegmentbox display={"flex"} justifyContent="flex-end">
            <GenericButton
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Save
            </GenericButton>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default NameSegment;
