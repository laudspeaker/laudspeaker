import { useState } from "react";
import { Grid, FormControl, Tooltip, MenuItem } from "@mui/material";
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

const NameTemplate = ({ onSubmit, isPrimary }: INameSegment) => {
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

  const handleType = (value: any) => {
    setDay(value);
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
    <div>
      <div className="flex items-start justify-center">
        <div className="w-full">
          <h3>Name your Template</h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={segmentForm.name}
                placeholder={"Enter name"}
                name="name"
                id="name"
                className="w-full px-[16px] py-[15px] bg-[#fff] border-[1px] border-[#D1D5DB] font-[Inter] text-[16px] "
                onChange={handleSegmentFormChange}
              />
            </FormControl>
            <form className="w-auto mt-[20px]">
              <label
                htmlFor="handleDay"
                className="font-[Inter] text-[16px] mb-[10px] font-medium"
              >
                Type of template:
              </label>
              <Select
                id="handleDay"
                name="handleDay"
                value={day}
                onChange={handleType}
                options={[
                  { value: "email" },
                  { value: "slack" },
                  { value: "sms" },
                ]}
                displayEmpty
              />
            </form>
          </Grid>
          <div className="flex justify-end">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameTemplate;
