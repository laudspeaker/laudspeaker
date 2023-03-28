import { ApiConfig } from "../../constants";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import React, { ReactNode, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import Template, { TemplateType } from "types/Template";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import Progress from "components/Progress";
import { GenericButton, Input, Select } from "components/Elements";

export enum WebhookMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

type WebhookHeaders = { Authorization?: string } & Record<string, string>;

interface WebhookState {
  url: string;
  method: WebhookMethod;
  body: string;
  headers: WebhookHeaders;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

enum AuthType {
  BEARER,
  BASIC,
  CUSTOM,
}

enum MIMEType {
  JSON = "application/json",
  HTML = "text/html",
  XML = "application/xml",
}

enum BodyType {
  JSON = `JSON (application/json)`,
  HTML = "HTML (text/html)",
  XML = "XML (application/xml)",
}

const WebhookBuilder = () => {
  const { name } = useParams();

  const [webhookState, setWebhookState] = useState<WebhookState>({
    url: "",
    method: WebhookMethod.GET,
    body: "",
    headers: {},
  });
  const [templateId, setTemplateId] = useState<number>();
  const [templateName, setTemplateName] = useState("My webhook template");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authType, setAuthType] = useState<AuthType>(AuthType.BEARER);
  const [bodyType, setBodyType] = useState(BodyType.JSON);

  const authComonents: Record<AuthType, ReactNode> = {
    [AuthType.BEARER]: (
      <div className="flex justify-between items-center">
        <div>Token</div>
        <div>
          <Input
            value={webhookState.headers.Authorization?.split(" ")?.[1] || ""}
            onChange={(e) =>
              setWebhookState({
                ...webhookState,
                headers: {
                  ...webhookState.headers,
                  Authorization: `Bearer ${e.target.value}`,
                },
              })
            }
            name="bearer-token"
          />
        </div>
      </div>
    ),
    [AuthType.BASIC]: (
      <>
        <div className="flex justify-between items-center">
          <div>Username</div>
          <div>
            <Input name="basic-username" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>Password</div>
          <div>
            <Input name="basic-password" />
          </div>
        </div>
      </>
    ),
    [AuthType.CUSTOM]: (
      <div className="flex justify-between items-center">
        <div>Header</div>
        <div>
          <Input
            name="custom-header"
            value={webhookState.headers.Authorization || ""}
            onChange={(e) =>
              setWebhookState({
                ...webhookState,
                headers: {
                  ...webhookState.headers,
                  Authorization: e.target.value,
                },
              })
            }
          />
        </div>
      </div>
    ),
  };

  const handleAuthType = (newAuthType: AuthType) => {
    setAuthType(newAuthType);
    setWebhookState({
      ...webhookState,
      headers: { ...webhookState.headers, Authorization: "" },
    });
  };

  const handleBodyType = (newBodyType: BodyType) => {
    setBodyType(newBodyType);

    setWebhookState({
      ...webhookState,
      body:
        newBodyType === BodyType.JSON
          ? "{}"
          : newBodyType === BodyType.HTML
          ? "<html></html>"
          : "<xml></xml>",
    });
  };

  const tabComponents = {
    Autorization: (
      <>
        <div className="flex justify-between items-center select-none">
          <div onClick={() => handleAuthType(AuthType.BEARER)}>
            <input
              type="radio"
              name="authtype"
              checked={authType === AuthType.BEARER}
            />
            <label htmlFor="authtype">Bearer Token</label>
          </div>
          <div onClick={() => handleAuthType(AuthType.BASIC)}>
            <input
              type="radio"
              name="authtype"
              value="Basic auth"
              checked={authType === AuthType.BASIC}
            />
            Basic Auth
          </div>
          <div onClick={() => handleAuthType(AuthType.CUSTOM)}>
            <input
              type="radio"
              name="authtype"
              value="Custom"
              checked={authType === AuthType.CUSTOM}
            />
            Custom
          </div>
        </div>
        <div>{authComonents[authType]}</div>
      </>
    ),
    Content: (
      <>
        <Select
          value={bodyType}
          options={[
            { value: BodyType.JSON },
            { value: BodyType.HTML },
            { value: BodyType.XML },
          ]}
          onChange={(val) => handleBodyType(val)}
        />
        <textarea
          value={webhookState.body}
          onChange={(e) =>
            setWebhookState({ ...webhookState, body: e.target.value })
          }
        />
      </>
    ),
    Headers: (
      <>
        <textarea
          value={Object.entries(webhookState.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")}
          onChange={(e) =>
            setWebhookState({
              ...webhookState,
              headers: Object.fromEntries(
                e.target.value
                  .split("\n")
                  .map((row) => row.split(":").map((el) => el.trim()))
                  .filter((entry) => entry.length === 2)
              ),
            })
          }
        />
      </>
    ),
  };
  const [currentTab, setCurrentTab] =
    useState<keyof typeof tabComponents>("Autorization");

  useLayoutEffect(() => {
    (async () => {
      try {
        const { data } = await ApiService.get<Template>({
          url: `${ApiConfig.getAllTemplates}/${name}`,
        });

        setTemplateId(data.id);
        setTemplateName(name);
      } catch (e) {
        toast.error("Error while loading");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setIsSaving(true);

    try {
      const reqBody = {
        name: templateName,
        type: TemplateType.WEBHOOK,
        webhookData: webhookState,
      };

      if (templateId) {
        await ApiService.patch({
          url: `${ApiConfig.getAllTemplates}/${name}`,
          options: {
            ...reqBody,
          },
        });
      } else {
        const { data } = await ApiService.post<Template>({
          url: `${ApiConfig.createTemplate}`,
          options: {
            ...reqBody,
          },
        });
        setTemplateId(data.id);
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

  const onPersonalizeClick = () => {
    // const focusRef = focusedInput === "title" ? titleRef : textRef;
    // const [get, set] =
    //   focusedInput === "title"
    //     ? [pushTitle, setPushTitle]
    //     : [pushText, setPushText];
    // const indexToInsert =
    //   (focusRef.current?.selectionStart || pushText?.length) ?? 0;
    // const newSlackMessageArr = get?.split("") ?? [];
    // newSlackMessageArr.splice(indexToInsert, 0, "{{}}");
    // set(newSlackMessageArr.join(""));
    // setIsPreview({ title: true, text: true });
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
      <div className="w-[490px] m-auto">
        <div className="flex justify-center items-center gap-[10px]">
          <Input
            name="webhookURL"
            id="webhookURL"
            placeholder="URL"
            value={webhookState.url}
            onChange={(e) =>
              setWebhookState({ ...webhookState, url: e.target.value })
            }
          />
          <Select
            value={webhookState.method}
            options={[
              { value: WebhookMethod.GET },
              { value: WebhookMethod.POST },
              { value: WebhookMethod.PUT },
              { value: WebhookMethod.PATCH },
              { value: WebhookMethod.DELETE },
              { value: WebhookMethod.HEAD },
              { value: WebhookMethod.OPTIONS },
            ]}
            onChange={(val) =>
              setWebhookState({ ...webhookState, method: val })
            }
          />
          <GenericButton onClick={() => {}}>Test</GenericButton>
        </div>
        <div className="px-4 sm:px-6 md:px-0">
          <div className="py-6">
            <div className="lg:hidden">
              <label htmlFor="selected-tab" className="sr-only">
                Select a tab
              </label>
              <Select
                id="selected-tab"
                name="selected-tab"
                options={[
                  { value: "Autorization" },
                  { value: "Content" },
                  { value: "Headers" },
                ]}
                wrapperClassnames="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                value={currentTab}
                onChange={(val) => setCurrentTab(val)}
              />
            </div>
            <div className="hidden lg:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {(
                    Object.keys(tabComponents) as (keyof typeof tabComponents)[]
                  ).map((tab) => (
                    <div
                      key={tab}
                      className={classNames(
                        tab === currentTab
                          ? "border-cyan-500 text-cyan-600"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                        "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer"
                      )}
                      onClick={() => setCurrentTab(tab)}
                    >
                      {tab}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
            {tabComponents[currentTab]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookBuilder;
