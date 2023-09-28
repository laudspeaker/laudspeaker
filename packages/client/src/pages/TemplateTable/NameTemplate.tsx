import { ChangeEvent, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { TemplateType } from "types/Template";
import Select from "components/Elements/Selectv2";

export interface INameSegmentForm {
  name: string;
  isPrimary: boolean;
}

interface INameSegment {
  onSubmit?: (e: INameSegmentForm) => void;
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
  const [templateType, setTemplateType] = useState(TemplateType.EMAIL);
  const navigate = useNavigate();

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
  };

  const handleType = (value: TemplateType) => {
    setTemplateType(value);
  };

  // Pushing state back up to the flow builder
  const handleSubmit = (e: { preventDefault: () => void }) => {
    if (segmentForm.name && templateType) {
      navigate(`/templates/${templateType}/${segmentForm.name}`);

      e.preventDefault();
      if (onSubmit) {
        onSubmit(segmentForm);
      }
    }
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit(e);
      }}
    >
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
            <form
              className="w-auto mt-[20px] flex justify-start items-center"
              onSubmit={handleSubmit}
            >
              <label
                htmlFor="handletemplateType"
                className="font-[Inter] whitespace-nowrap text-[16px] font-medium mr-1"
              >
                Type of template:
              </label>
              <Select
                id="handleTemplateType"
                value={templateType}
                onChange={handleType}
                className="min-w-[80px]"
                options={[
                  {
                    key: TemplateType.EMAIL,
                    title: TemplateType.EMAIL,
                  },
                  // Removed for 1 release
                  // {
                  //   key: TemplateType.SLACK,
                  //   title: TemplateType.SLACK,
                  // },
                  {
                    key: TemplateType.SMS,
                    title: TemplateType.SMS,
                  },
                  // Removed for 1 release
                  // { value: TemplateType.FIREBASE },
                  {
                    key: TemplateType.WEBHOOK,
                    title: TemplateType.WEBHOOK,
                  },
                  // { value: TemplateType.MODAL },
                  // { value: TemplateType.CUSTOM_MODAL, title: "custom modal" },
                ]}
              />
            </form>
          </Grid>
          <div className="flex justify-end">
            <GenericButton
              id="submitTemplateCreation"
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
              disabled={!segmentForm.name || !templateType}
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
