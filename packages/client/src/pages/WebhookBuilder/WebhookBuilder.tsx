import { ApiConfig } from "../../constants";
import SlackTemplateHeader from "pages/SlackBuilder/SlackTemplateHeader";
import React, {
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import Template, { TemplateType } from "types/Template";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import Progress from "components/Progress";
import { GenericButton, Input, Select, Textarea } from "components/Elements";

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

enum FallBackAction {
  NOTHING,
}

interface WebhookState {
  url: string;
  method: WebhookMethod;
  body: string;
  headers: WebhookHeaders;
  retries: number;
  fallBackAction: FallBackAction;
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

const mimeTypeMap: Record<BodyType, MIMEType> = {
  [BodyType.JSON]: MIMEType.JSON,
  [BodyType.HTML]: MIMEType.HTML,
  [BodyType.XML]: MIMEType.XML,
};

const WebhookBuilder = () => {
  const { name } = useParams();

  const [webhookState, setWebhookState] = useState<WebhookState>({
    url: "",
    method: WebhookMethod.GET,
    body: "",
    headers: {},
    retries: 5,
    fallBackAction: FallBackAction.NOTHING,
  });
  const [templateId, setTemplateId] = useState<number>();
  const [templateName, setTemplateName] = useState("My webhook template");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authType, setAuthType] = useState<AuthType>(AuthType.BEARER);
  const [bodyType, setBodyType] = useState(BodyType.JSON);
  const [headersString, setHeadersString] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const bearerTokenRef = useRef<HTMLInputElement>(null);
  const basicUserNameRef = useRef<HTMLInputElement>(null);
  const basicPasswordRef = useRef<HTMLInputElement>(null);
  const customHeaderRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const headersRef = useRef<HTMLTextAreaElement>(null);

  const [selectedRef, setSelectedRef] =
    useState<RefObject<HTMLInputElement | HTMLTextAreaElement>>();

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
            inputRef={bearerTokenRef}
            onFocus={() => setSelectedRef(bearerTokenRef)}
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
            <Input
              name="basic-username"
              inputRef={basicUserNameRef}
              onFocus={() => setSelectedRef(basicUserNameRef)}
              value={username}
              onChange={(el) => setUsername(el.target.value || "")}
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>Password</div>
          <div>
            <Input
              name="basic-password"
              inputRef={basicPasswordRef}
              onFocus={() => setSelectedRef(basicPasswordRef)}
              value={password}
              onChange={(el) => setPassword(el.target.value)}
            />
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
            inputRef={customHeaderRef}
            onFocus={() => setSelectedRef(customHeaderRef)}
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
              className="text-cyan-600 focus:ring-cyan-600 mr-[10px]"
            />
            <label htmlFor="authtype">Bearer Token</label>
          </div>
          <div onClick={() => handleAuthType(AuthType.BASIC)}>
            <input
              type="radio"
              name="authtype"
              value="Basic auth"
              checked={authType === AuthType.BASIC}
              className="text-cyan-600 focus:ring-cyan-600 mr-[10px]"
            />
            Basic Auth
          </div>
          <div onClick={() => handleAuthType(AuthType.CUSTOM)}>
            <input
              type="radio"
              name="authtype"
              value="Custom"
              checked={authType === AuthType.CUSTOM}
              className="text-cyan-600 focus:ring-cyan-600 mr-[10px]"
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
        <Textarea
          value={webhookState.body}
          onChange={(e) =>
            setWebhookState({ ...webhookState, body: e.target.value })
          }
          textareaRef={bodyRef}
          onFocus={() => setSelectedRef(bodyRef)}
        />
      </>
    ),
    Headers: (
      <>
        <Textarea
          value={headersString}
          onChange={(e) => setHeadersString(e.target.value)}
          textareaRef={headersRef}
          onFocus={() => setSelectedRef(headersRef)}
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

  useEffect(() => {
    setWebhookState({
      ...webhookState,
      headers: {
        Authorization: webhookState.headers.Authorization,
        ...Object.fromEntries(
          headersString
            .split("\n")
            .map((row) => row.split(":").map((el) => el.trim()))
            .filter((entry) => entry.length === 2)
        ),
      },
    });
  }, [headersString]);

  useEffect(() => {
    if (!username || !password) return;

    setWebhookState({
      ...webhookState,
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });
  }, [username, password]);

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
    if (selectedRef && selectedRef.current) {
      const indexToInsert = selectedRef.current.selectionStart || 0;
      selectedRef.current.value =
        selectedRef.current.value.slice(0, indexToInsert) +
        "{{ email }}" +
        selectedRef.current.value.slice(indexToInsert);
    }
  };

  if (isLoading) return <Progress />;

  const urlRegExp = new RegExp(
    /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/
  );

  const isValidURL = urlRegExp.test(webhookState.url);

  let host = "",
    path = "";

  if (isValidURL) {
    let pathParts: string[];
    [host, ...pathParts] = webhookState.url.split("//")[1].split("/");

    path = "/" + pathParts.join("/");
  }

  const rawRequest = `${webhookState.method} ${path} HTTP/1.1
    Host: ${host}
    ${Object.entries(webhookState.headers)
      .map(([key, value]) => `${key || ""}: ${value || ""}`)
      .join("\n")}
    ${
      [
        WebhookMethod.GET,
        WebhookMethod.DELETE,
        WebhookMethod.HEAD,
        WebhookMethod.OPTIONS,
      ].includes(webhookState.method)
        ? ""
        : `Content-Type: ${mimeTypeMap[bodyType]}
    Content-Length: ${webhookState.body.length}

    ${webhookState.body}`
    }`;

  const handleRetriesChange = (ret: number) => {
    let retries = ret;
    if (retries < 6 && retries >= 0) retries = ret;
    else if (retries === 6) {
      retries = 5;
    } else {
      retries = 0;
    }
    setWebhookState({ ...webhookState, retries });
  };

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
          <GenericButton customClasses="!h-[36px]" onClick={() => {}}>
            Test
          </GenericButton>
        </div>
        <div className="flex flex-col gap-[10px]">
          <div className="flex justify-between items-center">
            <div>Retries:</div>
            <div>
              <Input
                name="retries"
                id="retries"
                type="number"
                max={5}
                min={0}
                value={webhookState.retries}
                onChange={(e) => handleRetriesChange(+e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>Fallback action:</div>
            <div>
              <Select
                name="fallbackAction"
                id="fallbackAction"
                value={webhookState.fallBackAction}
                options={[
                  { value: FallBackAction.NOTHING, title: "Do nothing" },
                ]}
                onChange={(val) =>
                  setWebhookState({ ...webhookState, fallBackAction: val })
                }
              />
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 md:px-0">
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
          <div className="my-[20px] flex flex-col gap-[10px]">
            {tabComponents[currentTab]}
          </div>
          <div>
            <div className="relative mb-[6px] ">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white border-[1px] border-cyan-100 px-3 text-base rounded-md font-semibold leading-6 text-gray-700">
                  Raw
                </span>
              </div>
            </div>
            {isValidURL ? (
              <div className="whitespace-pre-line border-[2px] border-cyan-200 p-[10px] rounded-md bg-white">
                {rawRequest}
              </div>
            ) : (
              <div>Type valid url to see raw request</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookBuilder;
