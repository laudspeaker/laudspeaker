import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input, Select } from "components/Elements";
import { TriggerType } from "types/Workflow";
import ApiService from "services/api.service";

export interface INameSegmentForm {
  name: string;
  description: string;
  isDynamic: boolean;
  isPrimary: boolean;
  templates: string[];
  workflowId: string;
  messageType?: string;
  triggerType?: TriggerType;
}

interface INameSegment {
  onSubmit?: (form: INameSegmentForm) => void;
  isPrimary: boolean;
  isCollapsible: boolean;
  isSaving?: boolean;
  workflowId: string;
  edit?: boolean;
  audienceId?: string;
  showAdditionalSetup?: boolean;
}

const NameSegment = ({
  onSubmit,
  isPrimary,
  workflowId,
  isSaving = false,
  edit = false,
  audienceId,
  showAdditionalSetup = true,
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
    workflowId,
    templates: [],
  });
  const [isSetupPage, setIsSetupPage] = useState(false);

  const loadData = async () => {
    const { data } = await ApiService.get<{
      name: string;
      description: string;
    }>({
      url: "/audiences/" + audienceId,
    });

    setSegmentForm({
      ...segmentForm,
      name: data.name,
      description: data.description,
    });
  };

  useEffect(() => {
    if (edit) {
      loadData();
    }
  }, [edit, workflowId]);

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "name") {
      setSegmentForm({ ...segmentForm, name: e.target.value });
    }
    if (e.target.name === "description") {
      setSegmentForm({ ...segmentForm, description: e.target.value });
    }
  };

  // Pushing state back up to the flow builder
  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(segmentForm);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-center pt-[18px] mb-[50px]">
        <div className="w-full max-w-[1138px]">
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
                className="w-full p-[16px] bg-white border border-[#D1D5DB] font-[Inter] text-[16px]"
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
          {showAdditionalSetup && (
            <>
              <h3>Setup your step</h3>
              <div className="py-4 flex flex-col gap-[10px]">
                <div>
                  <Select
                    label="Add message"
                    options={[
                      { value: "email" },
                      { value: "slack" },
                      { value: "sms" },
                    ]}
                    value={segmentForm.messageType}
                    onChange={(value) =>
                      setSegmentForm({ ...segmentForm, messageType: value })
                    }
                  />
                </div>
                <div>
                  <Select
                    label="Add a trigger"
                    options={[
                      { value: TriggerType.EVENT, title: "event based" },
                      { value: TriggerType.TIME_DELAY, title: "time delay" },
                      { value: TriggerType.TIME_WINDOW, title: "time window" },
                    ]}
                    value={segmentForm.triggerType}
                    onChange={(value) =>
                      setSegmentForm({ ...segmentForm, triggerType: value })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {edit ? (
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
          ) : (
            <div className="flex justify-between gap-5" data-namesegmentbox>
              <GenericButton
                onClick={handleSubmit}
                disabled={!segmentForm.name}
                customClasses={`grayscale !bg-transparent !text-[14px] !text-gray-500 ${
                  !!segmentForm.name
                    ? "hover:!text-black"
                    : "hover:!text-gray-500"
                }  transition-all !p-[5px] !shadow-none`}
              >
                Finish later
              </GenericButton>
              <GenericButton
                id="saveNewSegment"
                onClick={handleSubmit}
                loading={isSaving}
                disabled={
                  !segmentForm.name ||
                  !(segmentForm.messageType || segmentForm.triggerType)
                }
                style={{
                  maxWidth: "200px",
                }}
              >
                Save
              </GenericButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameSegment;
