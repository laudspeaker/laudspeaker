import { GenericButton, Input, Select } from "components/Elements";
import Modal from "components/Elements/Modal";
import MergeTagInput from "components/MergeTagInput";
import MergeTagTextarea from "components/MergeTagTextarea";
import React, { FC, ReactNode, RefObject, useEffect, useState } from "react";
import ApiService from "services/api.service";
import { Buffer } from "buffer";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

export enum WebhookMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

export type WebhookHeaders = { Authorization?: string } & Record<
  string,
  string
>;

export enum FallBackAction {
  NOTHING,
}

export interface WebhookState {
  url: string;
  method: WebhookMethod;
  body: string;
  headers: WebhookHeaders;
  retries: number;
  fallBackAction: FallBackAction;
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

export interface TestResponseData {
  body: string;
  headers: Record<string, string>;
  status: number;
}

const mimeTypeMap: Record<BodyType, MIMEType> = {
  [BodyType.JSON]: MIMEType.JSON,
  [BodyType.HTML]: MIMEType.HTML,
  [BodyType.XML]: MIMEType.XML,
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface WebhookSettingsProps {
  webhookState: WebhookState;
  setWebhookState: (state: WebhookState) => void;
  webhookProps?: string;
  setWebhookProps?: (value: string) => void;
  possibleAttributes?: string[];
  setSelectedRef?: (
    ref?: RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSave?: () => Promise<void>;
  urlRef?: RefObject<HTMLInputElement>;
  bearerTokenRef?: RefObject<HTMLInputElement>;
  basicUserNameRef?: RefObject<HTMLInputElement>;
  basicPasswordRef?: RefObject<HTMLInputElement>;
  customHeaderRef?: RefObject<HTMLInputElement>;
  bodyRef?: RefObject<HTMLTextAreaElement>;
  headersRef?: RefObject<HTMLTextAreaElement>;
  selectedRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  setSelectedRefValueSetter?: (setter: {
    set: (value: string) => void;
  }) => void;
  className?: string;
}

const WebhookSettings: FC<WebhookSettingsProps> = ({
  webhookState,
  setWebhookState,
  webhookProps,
  setWebhookProps,
  possibleAttributes,
  setSelectedRef,
  onSave,
  urlRef,
  bearerTokenRef,
  basicUserNameRef,
  basicPasswordRef,
  customHeaderRef,
  bodyRef,
  headersRef,
  selectedRef,
  setSelectedRefValueSetter,
  className,
}) => {
  const [authType, setAuthType] = useState<AuthType>(AuthType.CUSTOM);
  const [bodyType, setBodyType] = useState(BodyType.JSON);
  const [headersString, setHeadersString] = useState(
    Object.entries(webhookState.headers || {})
      .filter(([key]) => key !== "Authorization")
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n") || ""
  );

  const [isURLPreview, setIsURLPreview] = useState(true);
  const [isBearerTokenPreview, setIsBearerTokenPreview] = useState(true);
  const [isBasicUserNamePreview, setIsBasicUserNamePreview] = useState(true);
  const [isBasicPasswordPreview, setIsBasicPasswordPreview] = useState(true);
  const [isCustomHeaderPreview, setIsCustomHeaderPreview] = useState(true);
  const [isBodyPreview, setIsBodyPreview] = useState(true);
  const [isHeadersPreview, setIsHeadersPreview] = useState(true);
  const [testCustomerEmail, setTestCustomerEmail] = useState("");
  const [testResponseData, setTestResponseData] = useState<TestResponseData>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
          "base64"
        )}`,
      },
    });
  }, [username, password]);

  const handleUrl = (value: string) =>
    setWebhookState({ ...webhookState, url: value });

  const handleBearerToken = (value: string) =>
    setWebhookState({
      ...webhookState,
      headers: {
        ...webhookState.headers,
        Authorization: `Bearer ${value}`,
      },
    });

  const handleBasicUserName = (value: string) => setUsername(value);

  const handleBasicPassword = (value: string) => setPassword(value);

  const handleCustomHeader = (value: string) =>
    setWebhookState({
      ...webhookState,
      headers: {
        ...webhookState.headers,
        Authorization: value,
      },
    });

  const handleBody = (value: string) =>
    setWebhookState({ ...webhookState, body: value });

  const handleHeaders = (value: string) => setHeadersString(value);

  const refSetterMap = new Map<
    RefObject<HTMLInputElement | HTMLTextAreaElement> | undefined,
    (value: string) => void
  >([
    [urlRef, handleUrl],
    [bearerTokenRef, handleBearerToken],
    [basicUserNameRef, handleBasicUserName],
    [basicPasswordRef, handleBasicPassword],
    [customHeaderRef, handleCustomHeader],
    [bodyRef, handleBody],
    [headersRef, handleHeaders],
  ]);

  useEffect(() => {
    if (setSelectedRefValueSetter)
      setSelectedRefValueSetter({
        set: refSetterMap.get(selectedRef) || (() => {}),
      });
  }, [selectedRef]);

  const authComonents: Record<AuthType, ReactNode> = {
    [AuthType.BEARER]: (
      <div className="flex justify-between items-center">
        <div>Token</div>
        <div>
          <MergeTagInput
            value={
              webhookState.headers.Authorization?.replace("Bearer ", "") || ""
            }
            onChange={(e) => handleBearerToken(e.target.value)}
            inputRef={bearerTokenRef}
            onFocus={() => setSelectedRef?.(bearerTokenRef)}
            name="bearer-token"
            id="bearer-token"
            isPreview={isBearerTokenPreview}
            setIsPreview={setIsBearerTokenPreview}
            placeholder="Bearer token"
            possibleAttributes={possibleAttributes || []}
            setValue={handleBearerToken}
            inputClassNames="!bg-white max-h-[36px] !p-[8px_12px] !text-[1rem]"
            viewerClassNames="max-h-[60px] !p-[8px_12px] !text-[1rem] !max-w-[310px] !min-w-[310px]"
          />
        </div>
      </div>
    ),
    [AuthType.BASIC]: (
      <>
        <div className="flex justify-between items-center">
          <div>Username</div>
          <div>
            <MergeTagInput
              name="basic-username"
              id="basic-username"
              inputRef={basicUserNameRef}
              onFocus={() => setSelectedRef?.(basicUserNameRef)}
              value={username}
              onChange={(e) => handleBasicUserName(e.target.value)}
              isPreview={isBasicUserNamePreview}
              placeholder="Username"
              possibleAttributes={possibleAttributes || []}
              setIsPreview={setIsBasicUserNamePreview}
              setValue={handleBasicUserName}
              inputClassNames="!bg-white max-h-[36px] !p-[8px_12px] !text-[1rem]"
              viewerClassNames="max-h-[60px] !p-[8px_12px] !text-[1rem] !max-w-[310px] !min-w-[310px]"
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>Password</div>
          <div>
            <MergeTagInput
              name="basic-password"
              id="basic-password"
              inputRef={basicPasswordRef}
              onFocus={() => setSelectedRef?.(basicPasswordRef)}
              value={password}
              onChange={(e) => handleBasicPassword(e.target.value)}
              isPreview={isBasicPasswordPreview}
              placeholder="Password"
              possibleAttributes={possibleAttributes || []}
              setIsPreview={setIsBasicPasswordPreview}
              setValue={handleBasicPassword}
              inputClassNames="!bg-white max-h-[36px] !p-[8px_12px] !text-[1rem]"
              viewerClassNames="max-h-[60px] !p-[8px_12px] !text-[1rem] !max-w-[310px] !min-w-[310px]"
            />
          </div>
        </div>
      </>
    ),
    [AuthType.CUSTOM]: (
      <div className="flex justify-between items-center">
        <div>Header</div>
        <div>
          <MergeTagInput
            name="custom-header"
            id="custom-header"
            value={webhookState.headers.Authorization || ""}
            onChange={(e) => handleCustomHeader(e.target.value)}
            inputRef={customHeaderRef}
            onFocus={() => setSelectedRef?.(customHeaderRef)}
            isPreview={isCustomHeaderPreview}
            placeholder="Custom header"
            possibleAttributes={possibleAttributes || []}
            setIsPreview={setIsCustomHeaderPreview}
            setValue={handleCustomHeader}
            inputClassNames="!bg-white max-h-[36px] !p-[8px_12px] !text-[1rem]"
            viewerClassNames="max-h-[60px] !p-[8px_12px] !text-[1rem] !max-w-[310px] !min-w-[310px]"
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
              readOnly
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
              readOnly
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
              readOnly
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
        <MergeTagTextarea
          id="webhook-body"
          name="webhook-body"
          value={webhookState.body}
          onChange={(e) => handleBody(e.target.value)}
          textareaRef={bodyRef}
          onFocus={() => setSelectedRef?.(bodyRef)}
          isPreview={isBodyPreview}
          placeholder="Content"
          possibleAttributes={possibleAttributes || []}
          setIsPreview={setIsBodyPreview}
          setValue={handleBody}
          inputClassNames="!bg-white !p-[8px_12px] !text-[1rem]"
          viewerClassNames="!p-[8px_12px] !text-[1rem]"
        />
      </>
    ),
    Headers: (
      <>
        <MergeTagTextarea
          id="webhook-headers"
          name="webhook-headers"
          value={headersString}
          onChange={(e) => handleHeaders(e.target.value)}
          textareaRef={headersRef}
          onFocus={() => setSelectedRef?.(headersRef)}
          isPreview={isHeadersPreview}
          placeholder="Headers"
          possibleAttributes={possibleAttributes || []}
          setIsPreview={setIsHeadersPreview}
          setValue={handleHeaders}
          inputClassNames="!bg-white !p-[8px_12px] !text-[1rem]"
          viewerClassNames="!p-[8px_12px] !text-[1rem]"
        />
      </>
    ),
  };
  const [currentTab, setCurrentTab] =
    useState<keyof typeof tabComponents>("Autorization");

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

  const handleTest = async () => {
    try {
      if (onSave) await onSave();

      const { data } = await ApiService.post<TestResponseData>({
        url: `/templates/test-webhook`,
        options: { webhookData: webhookState, testCustomerEmail },
      });

      setTestResponseData(data);
      toast.success("Successfully sent test request");
    } catch (e) {
      let message = "Error while doing test";
      if (e instanceof AxiosError) {
        message = String(e.response?.data?.message || message);
      }
      toast.error(message);
    }
  };

  return (
    <>
      <div className={`w-[490px] m-auto ${className}`}>
        <div className="flex justify-center items-center gap-[10px]">
          <MergeTagInput
            name="webhookURL"
            id="webhookURL"
            placeholder="URL"
            inputRef={urlRef}
            onFocus={() => setSelectedRef?.(urlRef)}
            value={webhookState.url}
            onChange={(e) => handleUrl(e.target.value)}
            isPreview={isURLPreview}
            possibleAttributes={possibleAttributes || []}
            setIsPreview={setIsURLPreview}
            setValue={handleUrl}
            inputClassNames="!bg-white max-h-[36px] !p-[8px_12px] !text-[1rem]"
            viewerClassNames="max-h-[60px] !p-[8px_12px] !text-[1rem] !max-w-[310px] !min-w-[310px]"
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
          <GenericButton customClasses="!h-[36px]" onClick={handleTest}>
            Test
          </GenericButton>
        </div>
        <div className="flex flex-col gap-[10px]">
          <div className="flex justify-between items-center">
            <div>Test customer email:</div>
            <div>
              <Input
                name="testCustomerEmail"
                id="testCustomerEmail"
                value={testCustomerEmail}
                onChange={(e) => setTestCustomerEmail(e.target.value)}
              />
            </div>
          </div>
          {webhookProps && setWebhookProps && (
            <div className="flex justify-between items-center">
              <div>Data to retrieve:</div>
              <div>
                <Input
                  name="webhookProps"
                  id="webhookProps"
                  value={webhookProps}
                  onChange={(e) => {
                    if (/^response\..*/.test(e.target.value) && setWebhookProps)
                      setWebhookProps(e.target.value);
                  }}
                />
              </div>
            </div>
          )}

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
          <div className="my-5 flex flex-col gap-[10px]">
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
                <span className="bg-white border border-cyan-100 px-3 text-base rounded-md font-semibold leading-6 text-gray-700">
                  Raw
                </span>
              </div>
            </div>
            {isValidURL ? (
              <div className="whitespace-pre-line border-2 border-cyan-200 p-[10px] rounded-md bg-white">
                {rawRequest}
              </div>
            ) : (
              <div>Type valid url to see raw request</div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={!!testResponseData}
        onClose={() => setTestResponseData(undefined)}
        dialogClass="!z-[9999999999]"
        panelClass="max-w-[70vw]"
      >
        {testResponseData && (
          <div>
            <div className="relative mb-[6px] ">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white border border-cyan-100 px-3 text-base rounded-md font-semibold leading-6 text-gray-700">
                  Status: {testResponseData.status}
                </span>
              </div>
            </div>
            <div className="relative mb-[6px] ">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white border border-cyan-100 px-3 text-base rounded-md font-semibold leading-6 text-gray-700">
                  Headers
                </span>
              </div>
            </div>
            <div className="w-max-full max-h-[60vh] overflow-y-scroll">
              {Object.entries(testResponseData.headers).map(([key, value]) => (
                <div>
                  {key}: {value}
                </div>
              ))}
            </div>
            <div className="relative mb-[6px] ">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white border border-cyan-100 px-3 text-base rounded-md font-semibold leading-6 text-gray-700">
                  Body
                </span>
              </div>
            </div>
            <div className="w-max-full max-h-[60vh] overflow-y-scroll whitespace-pre-wrap">
              {JSON.parse(JSON.stringify(testResponseData.body, null, 10))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default WebhookSettings;
