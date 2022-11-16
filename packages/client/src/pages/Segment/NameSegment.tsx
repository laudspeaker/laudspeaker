import { useState } from "react";
import { Grid, FormControl, Tooltip } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import InfoIcon from "assets/images/info.svg";
import ToggleSwitch from "./../../components/Elements/ToggleSwitch";

export interface INameSegmentForm {
  name: string;
  description: string;
  isDynamic: boolean;
  isPrimary: boolean;
}

const segmentTypeStyle =
  "border-[1px] border-[#D1D5DB] rouded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] w-[234px] mt-[20px] p-[15px]";

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
          <h3>Name your segment</h3>
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
          {isPrimary && (
            <div>
              <h3 className="pt-[20px]">Choose a segment type</h3>
              <div className={segmentTypeStyle}>
                <Grid
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p className="font-semibold text-[#111827]">Dynamic</p>
                  <ToggleSwitch
                    checked={segmentForm.isDynamic}
                    onChange={onToggleChange}
                  />
                </Grid>
                <Tooltip title="dynamic">
                  {/* <IconButton> */}
                  <div className="flex items-end cursor-default mt-[8px]">
                    <img src={InfoIcon} width="20px" />
                    <p className="text-[#4FA198] text-[12px] pl-[5px]">
                      What is a dynamic segment?
                    </p>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
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
