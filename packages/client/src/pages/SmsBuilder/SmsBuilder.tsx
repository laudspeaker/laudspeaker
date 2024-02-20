import styled from "@emotion/styled";
import { AxiosError } from "axios";
import Progress from "components/Progress";
import { getResources } from "pages/Segment/SegmentHelpers";
import { useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { MessageEditor } from "./MessageEditor";
import { MessagePreview } from "./MessagePreview";
import { TestMessage } from "./TestMessage";
import { PushHeader } from "pages/PushBuilder/PushHeader";

const StyledContainer = styled.div`
  display: grid;
  max-height: calc(100vh - 60px - 46px);
  overflow-y: auto;
  width: 100%;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr; /* Single column for smaller screens */
  }

  @media (min-width: 1280px) {
    grid-template-columns: 35% 65%;
    height: 100%;
  }
`;

const SmsBuilder = () => {
  const { id } = useParams();
  const [smsText, setSmsText] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My sms template");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSave = async (newName?: string) => {
    setIsSaving(true);

    try {
      const reqBody = {
        name: newName ?? templateName,
        smsText,
        type: "sms",
      };

      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${id}`,
        options: {
          ...reqBody,
        },
      });
      toast.success("Successfully saved template!");
      if (newName) setTemplateName(newName);
    } catch (e) {
      let message = "Unexpected error";
      if (e instanceof AxiosError) {
        message = e.response?.data?.message?.[0] || e.response?.data?.message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      try {
        const { data } = await getTemplate(id);
        setSmsText(data.smsText || "");
        setTemplateName(data.name);
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    };
    populateSlackBuilder();
  }, []);

  const steps = ["SMS", "Test"];

  if (isLoading) return <Progress />;

  return (
    <div className="w-full h-full">
      <PushHeader
        templateName={templateName}
        pageIndex={activeStep}
        setPageIndex={setActiveStep}
        onSave={onSave}
        stepperNames={steps}
        isSaving={isSaving}
      />
      {activeStep === 0 && (
        <StyledContainer>
          <MessagePreview message={smsText} />
          <MessageEditor message={smsText} setMessage={setSmsText} />
        </StyledContainer>
      )}
      {activeStep === 1 && <TestMessage message={smsText} />}
    </div>
  );
};

export default SmsBuilder;
