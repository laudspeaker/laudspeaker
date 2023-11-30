import { ChangeEvent, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { TemplateType } from "types/Template";
import Select from "components/Elements/Selectv2";
import ApiConfig from "../../../constants/api";
import ApiService from "services/api.service";
import {
  FallBackAction,
  WebhookMethod,
} from "pages/WebhookBuilder/WebhookSettings";
import { defaultModalState } from "pages/ModalBuilder/ModalBuilder";

export interface INameSegmentForm {
  name: string;
  isPrimary: boolean;
}

interface INameSegment {
  onSubmit?: (e: INameSegmentForm) => void;
  isPrimary: boolean;
}

export const requestCreationBody = (templateName: string) => ({
  [TemplateType.EMAIL]: {
    name: templateName,
    type: TemplateType.EMAIL,
  },
  [TemplateType.SMS]: {
    name: templateName,
    type: TemplateType.SMS,
  },
  [TemplateType.WEBHOOK]: {
    name: templateName,
    type: TemplateType.WEBHOOK,
  },
  [TemplateType.MODAL]: {
    name: templateName,
    type: TemplateType.MODAL,
    modalState: defaultModalState,
  },
  [TemplateType.PUSH]: {
    name: templateName,
    type: TemplateType.PUSH,
  },
});

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
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    if (segmentForm.name && templateType) {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          // @ts-ignore
          ...requestCreationBody(segmentForm.name)[templateType],
        },
      });

      navigate(`/templates/${templateType}/${response.data.id}`);

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
                className="w-full px-[16px] py-[15px] bg-[#fff] border border-[#D1D5DB] font-[Inter] text-[16px] "
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
                  {
                    key: TemplateType.SMS,
                    title: TemplateType.SMS,
                  },
                  {
                    key: TemplateType.WEBHOOK,
                    title: TemplateType.WEBHOOK,
                  },
                  {
                    key: TemplateType.PUSH,
                    title: "push notification",
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
