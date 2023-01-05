import { ChangeEvent, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";

export interface INameSegmentForm {
  name: string;
  isPrimary: boolean;
}

interface INameSegment {
  isPrimary: boolean;
}

const NamePerson = ({ isPrimary }: INameSegment) => {
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
  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
  };

  const handleSubmit = async () => {
    const { data } = await ApiService.post({
      url: `${ApiConfig.customerCreate}`,
      options: {
        name: segmentForm.name,
      },
    });
    if (data) navigate(`/person/${data}`);
  };

  return (
    <div>
      <div className="flex items-start justify-center pt-[18px]">
        <div className="bg-white rounded-3xl w-full max-w-[1138px]">
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
          </Grid>
          <div className="mt-6 flex justify-end space-x-3 md:mt-0 md:ml-4">
            <GenericButton
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
              disabled={!segmentForm?.name?.trim()}
            >
              Create Person
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NamePerson;
