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
import TrashIcon from "assets/icons/TrashIcon";

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

enum AuthType {
  BEARER,
  BASIC,
  CUSTOM,
}

export enum MIMEType {
  JSON = "application/json",
  HTML = "text/html",
  XML = "application/xml",
}

enum BodyType {
  JSON = `JSON (application/json)`,
  HTML = "HTML (text/html)",
  XML = "XML (application/xml)",
}

export interface WebhookState {
  url: string;
  method: WebhookMethod;
  body: string;
  mimeType: MIMEType;
  headers: WebhookHeaders;
  retries: number;
  fallBackAction: FallBackAction;
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

const bodyTypeMap: Record<MIMEType, BodyType> = {
  [MIMEType.JSON]: BodyType.JSON,
  [MIMEType.HTML]: BodyType.HTML,
  [MIMEType.XML]: BodyType.XML,
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type SetWebhookStateAction =
  | WebhookState
  | ((prevState: WebhookState) => WebhookState);

interface WebhookSettingsProps {
  webhookState: WebhookState;
  setWebhookState: (state: SetWebhookStateAction) => void;
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
  bodyRef?: RefObject<HTMLTextAreaElement>;
  headersRef?: RefObject<HTMLTextAreaElement>;
  customHeaderKeyRef?: RefObject<HTMLInputElement>;
  customHeaderValueRef?: RefObject<HTMLInputElement>;
  selectedRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  setSelectedRefValueSetter?: (setter: {
    set: (value: string) => void;
  }) => void;
  className?: string;
  isTesting?: boolean;
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
  customHeaderKeyRef,
  customHeaderValueRef,
  bodyRef,
  selectedRef,
  setSelectedRefValueSetter,
  className,
  isTesting,
}) => {
  const [authType, setAuthType] = useState<AuthType>(AuthType.CUSTOM);
  const [bodyType, setBodyType] = useState(
    bodyTypeMap[webhookState.mimeType] || BodyType.JSON
  );
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse>();
  const [testResponseData, setTestResponseData] = useState<TestResponseData>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [customHeaders, setCustomHeaders] = useState<
    { key: string; value: string }[]
  >(
    Object.entries(webhookState.headers)
      .filter(([key]) => key !== "Authorization")
      .map(([key, value]) => ({ key, value }))
  );

  useEffect(() => {
    if (!username || !password) return;

    setWebhookState({
      ...webhookState,
      headers: {
        ...webhookState.headers,
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
          "base64"
        )}`,
      },
    });
  }, [username, password]);

  useEffect(() => {
    const authorizationHeader = webhookState.headers.Authorization;

    setWebhookState({
      ...webhookState,
      headers: {
        ...customHeaders.reduce((acc, el) => {
          acc[el.key] = el.value;
          return acc;
        }, {} as Record<string, string>),
        Authorization: authorizationHeader || "",
      },
    });
  }, [customHeaders]);

  useEffect(() => {
    setWebhookState({ ...webhookState, mimeType: mimeTypeMap[bodyType] });
  }, [bodyType]);

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

  const refSetterMap = new Map<
    RefObject<HTMLInputElement | HTMLTextAreaElement> | undefined,
    (value: string) => void
  >([
    [urlRef, handleUrl],
    [bearerTokenRef, handleBearerToken],
    [basicUserNameRef, handleBasicUserName],
    [basicPasswordRef, handleBasicPassword],
    [bodyRef, handleBody],
  ]);

  useEffect(() => {
    if (setSelectedRefValueSetter)
      setSelectedRefValueSetter({
        set: refSetterMap.get(selectedRef) || (() => {}),
      });
  }, [selectedRef]);

  const authComponents: Record<AuthType, ReactNode> = {
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
          // onFocus={() => setSelectedRef?.(customHeaderRef)}
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
              id="authtype_custom"
            />
            Custom
          </div>
        </div>
        <div className="text-sm leading-[22px] flex flex-col">
          {authComponents[authType]}
        </div>
      </>
    ),
    Headers: (
      <>
        {customHeaders.map(({ key, value }, i) => (
          <div
            key={i}
            className="flex items-center bg-gray-200 gap-8 p-2.5 rounded"
          >
            <Input
              wrapperClassName="w-full"
              className="w-full"
              name={`custom-header-name-${i}`}
              id={`custom-header-name-${i}`}
              value={key || ""}
              onChange={(e) => {
                if (!e) {
                  customHeaders.splice(i, 1);
                } else {
                  customHeaders[i].key = e;
                }

                setCustomHeaders([...customHeaders]);
              }}
              onFocus={() => setSelectedRef?.(customHeaderKeyRef)}
              placeholder="header name"
            />
            :
            <Input
              // key={`input-${index}`} // Set a constant key for the Input
              wrapperClassName="w-full"
              className="w-full"
              name={`custom-header-value-${i}`}
              id={`custom-header-value-${i}`}
              value={value || ""}
              onChange={(e) => {
                customHeaders[i].value = e;
                setCustomHeaders([...customHeaders]);
              }}
              onFocus={() => setSelectedRef?.(customHeaderValueRef)}
              placeholder="header value"
            />
            <button
              onClick={() => {
                customHeaders.splice(i, 1);
                setCustomHeaders([...customHeaders]);
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <Button
          type={ButtonType.SECONDARY}
          className="w-fit"
          onClick={() => {
            if (customHeaders.find(({ key }) => key === "")) return;

            setCustomHeaders([...customHeaders, { key: "", value: "" }]);
          }}
          id="add-header"
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
    ${Object.entries({ ...webhookState.headers })
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
            headers: { ...webhookState.headers },
          },
          testCustomerId: selectedCustomer?.id,
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
              {!isTesting && (
                <>
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
                        {
                          key: WebhookMethod.PATCH,
                          title: WebhookMethod.PATCH,
                        },
                        {
                          key: WebhookMethod.DELETE,
                          title: WebhookMethod.DELETE,
                        },
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
                      id="webhookMethod"
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
                  </div>
                </>
              )}
            </div>

            {isTesting ? (
              <></>
            ) : (
              <>
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
                            {
                              key: FallBackAction.NOTHING,
                              title: "Do nothing",
                            },
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
              </>
            )}
          </div>

          {isTesting && (
            <>
              <div className="pb-5 w-full mt-5">
                <div className="px-5 flex flex-col gap-2.5 pt-2.5">
                  <p className="text-[16px] font-semibold leading-[24px]">
                    Preview with sample user
                  </p>
                  <SearchUser
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    previewFieldKey="email"
                    buttonClassName="w-full"
                    isWebhook
                  />
                </div>
              </div>

              <div className="px-5">
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={handleTest}
                  className="min-w-[100px]"
                >
                  Send test
                </Button>
              </div>
            </>
          )}

          {!isTesting && (
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setCurrentTab(tab);
                          }}
                          data-testid={`tab-${tab}`}
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
          )}
        </div>
      </div>
      <Modal
        isOpen={!!testResponseData}
        onClose={() => setTestResponseData(undefined)}
        dialogClass="!z-[9999999999]"
        panelClass="rounded-none p-8 pb-6 !max-w-[800px] overflow-x-auto"
        closeButtonNeed={false}
        hasBottomActionButtons
        onRetest={handleTest}
      >
        {testResponseData && (
          <>
            <div className="text-xl	font-semibold mb-2">
              Status: {testResponseData.status}
            </div>
            <div>
              <div className="text-base mb-2">Headers</div>
              <div
                className={`${
                  Object.keys(testResponseData.headers).length ? "mb-2" : ""
                } w-max-full max-h-[60vh] overflow-y-auto text-base leading-[22px]`}
              >
                {Object.entries(testResponseData.headers).map(
                  ([key, value]) => (
                    <div key={key}>
                      {key}: {value}
                    </div>
                  )
                )}
              </div>
              <hr className="h-px border-[#E5E7EB] mb-2" />
              <div className="text-base mb-2">Body</div>
              <div className="w-max-full max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-base leading-[22px] mb-2">
                {JSON.parse(JSON.stringify(testResponseData.body, null, 10))}
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default WebhookSettings;
