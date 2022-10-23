import { useState } from "react";
import { Grid, FormControl } from "@mui/material";
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
      <div className="flex items-start justify-center pt-[18px] mb-[50px]">
        <div className="bg-white rounded-3xl p-[22px_30px_77px_30px] w-full max-w-[1138px]">
          <h3>Name your Person</h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={segmentForm.name}
                placeholder={"Enter name"}
                name="name"
                id="name"
                style={{
                  width: "100%",
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
                options={[
                  { value: "email" },
                  { value: "slack" },
                  { value: "sms" },
                ]}
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
              />
            </FormControl>
          </Grid>
          <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              onClick={handleSubmit}
            >
              Create Person
            </button>
          </div>
          {/* 
          <div className="flex justify-end">
            <GenericButton
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
            >
              Create Person
            </GenericButton>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default NamePerson;
