import { ApiConfig } from "../../constants";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import { getResources } from "pages/Segment/SegmentHelpers";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import MergeTagInput from "components/MergeTagInput";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import Progress from "components/Progress";

const FirebaseBuilder = () => {
  const { name } = useParams();
  const [pushText, setPushText] = useState<string>("");
  const [pushTitle, setPushTitle] = useState<string>("");

  const [templateName, setTemplateName] = useState<string>("My push template");
  const [firebaseTemplateId, setFirebaseTemplateId] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState({ title: true, text: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  const [focusedInput, setFocusedInput] = useState<"title" | "text">("title");

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSave = async () => {
    setIsSaving(true);

    try {
      const reqBody = {
        name: templateName,
        pushText,
        pushTitle,
        type: "firebase",
      };

      if (!firebaseTemplateId) {
        const response = await ApiService.post({
          url: `${ApiConfig.createTemplate}`,
          options: {
            ...reqBody,
          },
        });
        setFirebaseTemplateId(response.data.id);
      } else {
        await ApiService.patch({
          url: `${ApiConfig.getAllTemplates}/${name}`,
          options: {
            ...reqBody,
          },
        });
      }
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
        const { data } = await getTemplate(name);
        setPushText(data.pushText);
        setPushTitle(data.pushTitle);
        setTemplateName(name);
        setFirebaseTemplateId(data.id);
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    };
    const loadAttributes = async () => {
      const { data } = await getResources("attributes");
      setPossibleAttributes(
        data.options.map((option: { label: string }) => option.label)
      );
    };
    populateSlackBuilder();
    loadAttributes();
  }, []);

  const onPersonalizeClick = () => {
    const focusRef = focusedInput === "title" ? titleRef : textRef;
    const [get, set] =
      focusedInput === "title"
        ? [pushTitle, setPushTitle]
        : [pushText, setPushText];
    const indexToInsert =
      (focusRef.current?.selectionStart || pushText?.length) ?? 0;
    const newSlackMessageArr = get?.split("") ?? [];
    newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    set(newSlackMessageArr.join(""));
    setIsPreview({ title: true, text: true });
  };

  if (isLoading) return <Progress />;

  return (
    <div className="w-full">
      <SlackTemplateHeader
        onPersonalizeClick={onPersonalizeClick}
        onSave={onSave}
        loading={isSaving}
        templateName={templateName}
        handleTemplateNameChange={(e) => setTemplateName(e.target.value)}
      />
      <div style={{ width: "490px", margin: "auto" }}>
        <MergeTagInput
          isRequired
          value={pushTitle}
          placeholder={"Push Title"}
          name="pushTitle"
          id="pushTitle"
          fullWidth
          setValue={setPushTitle}
          onChange={(e) => setPushTitle(e.target.value)}
          labelShrink
          isPreview={isPreview.title}
          setIsPreview={(_isPreview) =>
            setIsPreview({
              title: _isPreview.valueOf() as boolean,
              text: isPreview.text,
            })
          }
          possibleAttributes={possibleAttributes}
          inputRef={titleRef}
          onFocus={() => setFocusedInput("title")}
        />
        <MergeTagInput
          isRequired
          value={pushText}
          placeholder={"Push Text"}
          name="pushText"
          id="pushText"
          fullWidth
          setValue={setPushText}
          onChange={(e) => setPushText(e.target.value)}
          labelShrink
          isPreview={isPreview.text}
          setIsPreview={(_isPreview) =>
            setIsPreview({
              text: _isPreview.valueOf() as boolean,
              title: isPreview.title,
            })
          }
          possibleAttributes={possibleAttributes}
          inputRef={textRef}
          onFocus={() => setFocusedInput("text")}
        />
        <div className="text-gray-500">
          <h3>Things you should notice:</h3>
          <div className="text-[12px]">
            <div>
              * if title length is over 48 it will be limited to first 48
              characters to meet system's requirementsxx
            </div>
            <div>
              * if text length is over 256 it will be limited to first 256
              characters to meet system's requirements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseBuilder;
