import { useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";

export interface INameSegmentForm {
  name: string;
  description: string;
  isDynamic: boolean;
  isPrimary: boolean;
}

interface INameSegment {
  onSubmit?: (e: any) => void;
  isPrimary: boolean;
  isCollapsible: boolean;
  onClose: () => void;
}

const NameSegment = ({ onSubmit, isPrimary }: INameSegment) => {
  // A Segment initally has three Properties:
  //      1. Dynamic: whether new customers are added
  //         after a workflow is live
  //      2. Name, the name of the segment
  //      3. Description, the segment description
  const [segmentForm, setSegmentForm] = useState<INameSegmentForm>({
    isDynamic: true,
    name: "",
    description: isPrimary ? "initial step" : "",
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

  // Pushing state back up to the flow builder
  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(segmentForm);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-center pt-[18px] mb-[50px]">
        <div
          className="w-full max-w-[1138px]"
          // sx={{
          //   padding: "22px 30px 77px 30px",
          //   width: "100%",
          //   maxWidth: "1138px",
          //   position: "relative",
          // }}
        >
          <h3>Name Your Step</h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                label="Name"
                value={segmentForm.name}
                placeholder={"Enter name"}
                name="name"
                id="name"
                className="w-full p-[16px] bg-white border-[1px] border-[#D1D5DB] font-[Inter] text-[16px]"
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
          <div className="flex justify-end" data-namesegmentbox>
            <GenericButton
              id="saveNewSegment"
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
              disabled={!segmentForm.name}
            >
              Save
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameSegment;
