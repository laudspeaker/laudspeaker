import { ChangeEvent, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import ApiService from "services/api.service";
import { ApiConfig } from "../../../constants";
import { useAppSelector } from "store/hooks";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import { enforceType } from "pages/Personv2/Personv2";

export interface INameSegmentForm {
  pkValue: any;
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
    pkValue: "",
    isPrimary: isPrimary,
  });

  const pk = useAppSelector((state) => state.auth.userData.pk);

  const navigate = useNavigate();

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "pkValue") {
      setSegmentForm({ ...segmentForm, pkValue: e.target.value });
    }
  };

  if (!pk) return <>Please, enter primary key in settings!</>;

  const handleSubmit = async () => {
    const { data } = await ApiService.post({
      url: `${ApiConfig.customerCreate}`,
      options: {
        [pk.key || ""]: enforceType(segmentForm.pkValue, pk.type),
      },
    });
    if (data) navigate(`/person/${data}`);
  };

  return (
    <div>
      <div className="flex items-start justify-center pt-[18px]">
        <div className="bg-white rounded-3xl w-full max-w-[1138px]">
          <h3>Enter customer's primary value ({pk.key})</h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <DynamicInput
                value={segmentForm.pkValue}
                onChange={(value) =>
                  setSegmentForm({ ...segmentForm, pkValue: value })
                }
                type={pk.type}
                isArray={pk.isArray}
                dateFormat={pk.dateFormat}
              />
            </FormControl>
          </Grid>
          <div className="mt-6 flex justify-end space-x-3 md:mt-0 md:ml-4">
            <GenericButton
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
              disabled={!segmentForm?.pkValue?.trim()}
              id="create-person-modal-button"
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
