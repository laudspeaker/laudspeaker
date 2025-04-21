import styled from "@emotion/styled";
import { AxiosError } from "axios";
import Progress from "components/Progress";
import { useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import InAppMessageEditor from "./InAppMessageEditor";
import { InAppMessageHeader } from "./InAppMessageHeader";
import InAppMessageDrawer from "./InAppMessageDrawer";

const InAppMessageBuilder = () => {
  const { id } = useParams();
  const [templateName, setTemplateName] = useState<string>(
    "In-App Message name"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  useLayoutEffect(() => {
    const populateSlackBuilder = async () => {
      try {
        const { data } = await getTemplate(id);
        console.log(data, "data");
        setTemplateName(data.name);
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    };
    populateSlackBuilder();
  }, []);

  const onSave = async (newName?: string) => {
    setIsSaving(true);

    try {
      const reqBody = {
        name: newName ?? templateName,
        type: "in-app-message",
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

  const steps = ["Template", "Design", "Settings and test"];

  if (isLoading) return <Progress />;

  return (
    <div className="w-full h-full">
      <InAppMessageHeader
        templateName={templateName}
        pageIndex={activeStep}
        setPageIndex={setActiveStep}
        onSave={onSave}
        stepperNames={steps}
        isSaving={isSaving}
      />
      {activeStep === 0 && (
        <div className="relative flex w-full h-full ">
          <InAppMessageDrawer setSelectedTemplateId={setSelectedTemplateId} />
          <InAppMessageEditor selectedTemplateId={selectedTemplateId} />
        </div>
      )}
      {activeStep === 1 && <></>}
      {activeStep === 2 && <></>}
    </div>
  );
};

export default InAppMessageBuilder;
