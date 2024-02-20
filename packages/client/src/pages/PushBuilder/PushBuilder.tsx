import { AxiosError } from "axios";
import ApiConfig from "constants/api";
import { isEqual } from "lodash";
import TemplateInlineEditor from "pages/FlowBuilderv2/TemplateInlineEditor";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useBeforeUnload } from "react-use";
import { setTemplateInlineCreator } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Template, { TemplateType } from "types/Template";
import deepCopy from "utils/deepCopy";
import PushBuilderContent, {
  PushBuilderData,
  PushPlatforms,
  defaultPlatformSettings,
} from "./PushBuilderContent";
import PushBuilderTestTab from "./PushBuilderTestTab";
import { PushHeader } from "./PushHeader";

interface PushBuilderProps {
  isInlineCreator?: boolean;
}

const PushBuilder = ({ isInlineCreator }: PushBuilderProps) => {
  const { templateInlineCreation } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useDispatch();

  const [initialPushBuilderData, setInitialPushBuilderData] =
    useState<PushBuilderData | null>();
  const [pushBuilderData, setPushBuilderData] = useState<PushBuilderData>({
    platform: {
      [PushPlatforms.ANDROID]: true,
      [PushPlatforms.IOS]: true,
    },
    keepContentConsistent: true,
    settings: {
      [PushPlatforms.ANDROID]: defaultPlatformSettings,
      [PushPlatforms.IOS]: defaultPlatformSettings,
    },
    fields: [],
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSame, setIsSame] = useState(true);
  const { id: paramsId } = useParams();

  const id = isInlineCreator ? templateInlineCreation?.templateId : paramsId;

  const loadData = async (withData?: boolean, updateInitial?: boolean) => {
    if (!id) return;

    const { data } = await ApiService.get<Template>({
      url: "/templates/" + id,
    });

    setTemplateName(data.name);
    if (withData && data.pushObject) setPushBuilderData({ ...data.pushObject });
    if (updateInitial && data.pushObject)
      setInitialPushBuilderData(deepCopy(data.pushObject));
  };

  useEffect(() => {
    loadData(true, true);
  }, [id]);

  const onSave = async (newName?: string) => {
    if (!id) return;

    setIsSaving(true);

    const reqBody = {
      type: TemplateType.PUSH,
      name: newName || templateName,
      ...(newName
        ? {}
        : {
            pushObject: pushBuilderData,
          }),
    };

    try {
      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${id}`,
        options: {
          ...reqBody,
        },
      });
      loadData(false, true);
      toast.success("Successfully saved template!");
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

  useEffect(() => {
    setIsSame(isEqual(pushBuilderData, initialPushBuilderData));
  }, [pushBuilderData]);

  useBeforeUnload(
    !isSame && !isInlineCreator,
    "You have unsaved changes, are you sure you want to leave?"
  );

  const handleInlineCreatedTemplate = (createdId: string) => {
    if (!templateInlineCreation) return;

    dispatch(
      setTemplateInlineCreator({
        ...templateInlineCreation,
        templateId: createdId,
      })
    );
  };

  const handleBackToJourney = async () => {
    if (!isInlineCreator || !templateInlineCreation) return;

    if (!templateInlineCreation.needsCallbackUpdate) {
      dispatch(setTemplateInlineCreator(undefined));
    }
    await onSave();

    dispatch(
      setTemplateInlineCreator({
        ...templateInlineCreation,
        needsCallbackUpdate: {
          id: id,
          name: templateName,
          data: pushBuilderData,
        },
      })
    );
  };

  return (
    <>
      <PushHeader
        templateName={templateName}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        onSave={onSave}
        isSaving={isSaving}
        isInlineCreator={isInlineCreator}
        handleBackToJourney={handleBackToJourney}
      />
      {templateInlineCreation && !templateInlineCreation.templateId ? (
        <TemplateInlineEditor
          type={templateInlineCreation.type}
          onTemplateCreated={handleInlineCreatedTemplate}
        />
      ) : pageIndex === 0 ? (
        <PushBuilderContent
          data={pushBuilderData}
          onChange={setPushBuilderData}
        />
      ) : (
        <PushBuilderTestTab
          data={pushBuilderData}
          onChange={setPushBuilderData}
        />
      )}
    </>
  );
};

export default PushBuilder;
