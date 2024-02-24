import Modal from "components/Elements/Modal";
import React, { FC, ReactNode, RefObject, useEffect, useState } from "react";
import ApiService from "services/api.service";
import { Buffer } from "buffer";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2";
import Input from "components/Elements/Inputv2";
import { Textarea } from "components/Elements";
import { CustomerResponse, SearchUser } from "pages/PushBuilder/SearchUser";

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
  setSelectedRef,
  onSave,
  urlRef,
  bearerTokenRef,
  basicUserNameRef,
  basicPasswordRef,
  customHeaderRef,
  bodyRef,
  selectedRef,
  setSelectedRefValueSetter,
  className,
}) => {
  const [authType, setAuthType] = useState<AuthType>(AuthType.CUSTOM);
  const [bodyType, setBodyType] = useState(BodyType.JSON);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse>();
  const [testResponseData, setTestResponseData] = useState<TestResponseData>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

  const [headers, setHeaders] = useState([""]);
  const customHeaders = headers.reduce(
    (acc: Record<string, string>, header) => {
      const [key, value] = header.split(":");
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    },
    {}
  );

  const handleAddHeader = () => {
    setHeaders([...headers, ""]);
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

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
  ]);

  useEffect(() => {
    if (setSelectedRefValueSetter)
      setSelectedRefValueSetter({
        set: refSetterMap.get(selectedRef) || (() => {}),
      });
  }, [selectedRef]);

  const authComonents: Record<AuthType, ReactNode> = {
    [AuthType.BEARER]: (
      <div className="flex items-center bg-gray-200 gap-8 p-2.5 rounded">
        <div className="font-semibold">Token</div>
        <Input
          value={
            webhookState.headers.Authorization?.replace("Bearer ", "") || ""
          }
          onChange={handleBearerToken}
          onFocus={() => setSelectedRef?.(bearerTokenRef)}
          name="bearer-token"
          id="bearer-token"
          placeholder="Header"
          className="w-full"
          wrapperClassName="w-full"
        />
      </div>
    ),
    [AuthType.BASIC]: (
      <>
        <div className="flex items-center rounded-t-[4px] bg-gray-200 gap-8 px-2.5 pt-2.5">
          <div className="min-w-[70px] font-semibold">Username</div>
          <Input
            className="w-full"
            wrapperClassName="w-full"
            name="basic-username"
            id="basic-username"
            onFocus={() => setSelectedRef?.(basicUserNameRef)}
            value={username}
            onChange={handleBasicUserName}
            placeholder="Username"
          />
        </div>
        <div className="flex items-center rounded-b-[4px] bg-gray-200 gap-8 p-2.5">
          <div className="min-w-[70px] font-semibold">Password</div>
          <Input
            wrapperClassName="w-full"
            className="w-full"
            name="basic-password"
            id="basic-password"
            value={password}
            onChange={handleBasicPassword}
            placeholder="Password"
          />
        </div>
      </>
    ),
    [AuthType.CUSTOM]: (
      <div className="flex items-center bg-gray-200 gap-8 p-2.5 rounded">
        <div className="w-[70px] font-semibold">Header</div>
        <Input
          wrapperClassName="w-full"
          className="w-full"
          name="custom-header"
          id="custom-header"
          value={webhookState.headers.Authorization || ""}
          onChange={handleCustomHeader}
          onFocus={() => setSelectedRef?.(customHeaderRef)}
          placeholder="Header"
        />
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
    Authorization: (
      <>
        <div className="flex gap-2.5 items-center select-none text-sm	leading-[22px]">
          <div onClick={() => handleAuthType(AuthType.BEARER)}>
            <input
              type="radio"
              name="authtype"
              checked={authType === AuthType.BEARER}
              className="text-[#6366F1] focus:ring-[#6366F1] mr-2"
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
              className="text-[#6366F1] focus:ring-[#6366F1] mr-2"
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
              className="text-[#6366F1] focus:ring-[#6366F1] mr-2"
              readOnly
            />
            Custom
          </div>
        </div>
        <div className="text-sm leading-[22px] flex flex-col">
          {authComonents[authType]}
        </div>
      </>
    ),
    Headers: (
      <>
        {headers.map((header, index) => (
          <div
            key={index}
            className="flex items-center bg-gray-200 gap-8 p-2.5 rounded"
          >
            <div className="text-[16px] font-semibold leading-[24px]">
              Header
            </div>

            <Input
              wrapperClassName="w-full"
              className="w-full"
              name={`custom-header-${index}`}
              id={`custom-header-${index}`}
              value={header || ""}
              onChange={(e) => handleHeaderChange(index, e)}
              onFocus={() => setSelectedRef?.(customHeaderRef)}
              placeholder="Header"
            />
          </div>
        ))}
        <Button
          type={ButtonType.SECONDARY}
          className="w-fit"
          onClick={handleAddHeader}
        >
          Add header
        </Button>
      </>
    ),
    Content: (
      <div className="p-2 bg-[#F3F4F6] gap-[10px] flex flex-col w-full rounded">
        <Select
          value={bodyType}
          options={[
            { key: BodyType.JSON, title: BodyType.JSON },
            { key: BodyType.HTML, title: BodyType.HTML },
            { key: BodyType.XML, title: BodyType.XML },
          ]}
          onChange={(val) => handleBodyType(val)}
          buttonClassName="w-fit"
        />
        <div className="w-full flex">
          <div className="w-[50px] bg-[#E5E7EB] rounded-l-[4px]" />
          <Textarea
            className="w-full rounded-l-none border-0"
            id="webhook-body"
            name="webhook-body"
            value={webhookState.body}
            onChange={(e) => handleBody(e.target.value)}
            textareaRef={bodyRef}
            onFocus={() => setSelectedRef?.(bodyRef)}
            placeholder="Content"
          />
        </div>
      </div>
    ),
  };
  const [currentTab, setCurrentTab] =
    useState<keyof typeof tabComponents>("Authorization");

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
    ${Object.entries({ ...webhookState.headers, ...customHeaders })
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
        options: {
          webhookData: {
            ...webhookState,
            headers: { ...webhookState.headers, ...customHeaders },
          },
          testCustomerEmail: selectedCustomer?.email,
        },
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
      <div
        className={`h-full flex flex-col md:flex-row w-full m-auto font-inter ${className}`}
      >
        <div className="h-full w-full md:w-[380px] overflow-y-hidden break-words order-2  md:order-1">
          <div className="h-[calc(100%-40px)] bg-white m-5 p-5">
            {isValidURL ? (
              <div className="whitespace-pre-line">{rawRequest}</div>
            ) : (
              <div>Enter valid url to see raw request</div>
            )}
          </div>
        </div>
        <div className="w-full h-full bg-white order-1 md:order-2">
          <div className="px-5 flex w-full flex-col gap-2.5">
            <div className="w-full flex flex-col gap-2.5">
              <p className="text-[16px] font-semibold pt-[20px] leading-[24px]">
                URL
              </p>
              <div className="flex items-center gap-[10px] w-full">
                <Select
                  value={webhookState.method}
                  options={[
                    { key: WebhookMethod.GET, title: WebhookMethod.GET },
                    { key: WebhookMethod.POST, title: WebhookMethod.POST },
                    { key: WebhookMethod.PUT, title: WebhookMethod.PUT },
                    { key: WebhookMethod.PATCH, title: WebhookMethod.PATCH },
                    { key: WebhookMethod.DELETE, title: WebhookMethod.DELETE },
                    { key: WebhookMethod.HEAD, title: WebhookMethod.HEAD },
                    {
                      key: WebhookMethod.OPTIONS,
                      title: WebhookMethod.OPTIONS,
                    },
                  ]}
                  buttonClassName="w-full"
                  className="w-fit max-w-[100px]"
                  onChange={(val) =>
                    setWebhookState({ ...webhookState, method: val })
                  }
                />
                <Input
                  wrapperClassName="w-full"
                  placeholder="Enter webhook URL"
                  className="w-full"
                  name="webhookURL"
                  id="webhookURL"
                  onFocus={() => setSelectedRef?.(urlRef)}
                  value={webhookState.url}
                  onChange={handleUrl}
                />
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={handleTest}
                  className="min-w-[100px]"
                >
                  Send test
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              {webhookProps && setWebhookProps && (
                <div className="flex justify-between items-center">
                  <div>Data to retrieve:</div>
                  <div>
                    <Input
                      name="webhookProps"
                      id="webhookProps"
                      value={webhookProps}
                      onChange={(e) => {
                        const event =
                          e as unknown as React.ChangeEvent<HTMLInputElement>;
                        if (
                          /^response\..*/.test(event.target.value) &&
                          setWebhookProps
                        )
                          setWebhookProps(event.target.value);
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex w-full justify-between gap-2">
                <div className="flex flex-col w-full gap-[5px]">
                  <p className="text-[16px] font-semibold leading-[24px]">
                    Retries
                  </p>
                  <div>
                    <Input
                      name="retries"
                      id="retries"
                      type="number"
                      max={5}
                      min={0}
                      value={webhookState.retries.toString()}
                      onChange={(e) => handleRetriesChange(parseInt(e))}
                      wrapperClassName="w-full"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-full gap-[5px]">
                  <p className="text-[16px] font-semibold leading-[24px]">
                    Fallback action
                  </p>
                  <div>
                    <Select
                      id="fallbackAction"
                      value={webhookState.fallBackAction}
                      options={[
                        { key: FallBackAction.NOTHING, title: "Do nothing" },
                      ]}
                      onChange={(val) =>
                        setWebhookState({
                          ...webhookState,
                          fallBackAction: val,
                        })
                      }
                      className="w-full"
                      buttonClassName="w-full"
                      panelClassName="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-y-[1px] pb-5 w-full mt-5 ">
            <div className="px-5 flex flex-col gap-2.5 pt-2.5">
              <p className="text-[16px] font-semibold leading-[24px]">
                Preview with sample user
              </p>
              <SearchUser
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                previewFieldKey="email"
                buttonClassName="w-full"
              />
            </div>
          </div>
          <div className="px-5">
            <div className="pt-2.5 md:pt-0">
              <div className="md:hidden">
                <label htmlFor="selected-tab" className="sr-only">
                  Select a tab
                </label>
                <Select
                  id="selected-tab"
                  options={[
                    { key: "Authorization", title: "Authorization" },
                    { key: "Headers", title: "Headers" },
                    { key: "Content", title: "Content" },
                  ]}
                  value={currentTab}
                  onChange={(val) =>
                    setCurrentTab(val as keyof typeof tabComponents)
                  }
                />
              </div>
              <div className="hidden md:block">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {(
                      Object.keys(
                        tabComponents
                      ) as (keyof typeof tabComponents)[]
                    ).map((tab) => (
                      <div
                        key={tab}
                        className={classNames(
                          tab === currentTab
                            ? "border-[#6366F1] text-[#6366F1]"
                            : "border-transparent text-black-500 hover:border-black-300 hover:text-black-700",
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
              <div className="my-2.5 flex flex-col gap-2.5">
                {tabComponents[currentTab]}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={!!testResponseData}
        onClose={() => setTestResponseData(undefined)}
        dialogClass="!z-[9999999999]"
        panelClass="rounded-none"
        closeButtonNeed={false}
        hasBottomActionButtons
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
            <div className="w-max-full max-h-[60vh] overflow-y-auto">
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
            <div className="w-max-full max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
              {JSON.parse(JSON.stringify(testResponseData.body, null, 10))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default WebhookSettings;
