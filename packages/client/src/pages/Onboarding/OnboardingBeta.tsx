/* eslint @typescript-eslint/dot-notation: 0 */

import Header from "components/Header";
import { ApiConfig } from "../../constants";
import React, {
  ChangeEvent,
  FocusEvent,
  useEffect,
  useLayoutEffect,
} from "react";
import ApiService from "services/api.service";
import Input from "../../components/Elements/Input";
import Select from "../../components/Elements/Select";
import { useTypedSelector } from "hooks/useTypeSelector";
import {
  setDomainsList,
  setSettingsPrivateApiKey,
  startPosthogImport,
} from "reducers/settings";
import { useDispatch } from "react-redux";
import { useState } from "react";
import CSS from "csstype";
import Modal from "components/Elements/Modal";
import { toast } from "react-toastify";
import { GenericButton } from "components/Elements";
import ExclamationTriangleIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "react-use";
import { RadioGroup } from "@headlessui/react";
import SnippetPicker from "components/SnippetPicker/SnippetPicker";

export const allEmailChannels = [
  {
    id: "free3",
    title: "Free 3 emails",
    subTitle: "Campaign: Onboarding Campaign",
    tooltip: "",
    disabled: false,
  },
  {
    id: "mailgun",
    title: "Mailgun",
    subTitle: "Campaign: Onboarding Campaign",
    tooltip: "",
    disabled: false,
  },
  {
    id: "sendgrid",
    title: "Sendgrid",
    subTitle: "for any campaign or newsletter",
    tooltip: "",
    disabled: false,
  },
  {
    id: "mailchimp",
    title: "Mailchimp",
    subTitle: "Campaign: Transactional Receipt",
    tooltip: "",
    disabled: true,
  },
  {
    id: "smtp",
    title: "SMTP",
    subTitle: "Setup your own email server",
    tooltip: "",
    disabled: true,
  },
];

export const allEventChannels = [
  {
    id: "segment",
    title: "Segment",
    subTitle: "for any campaign or newsletter",
    disabled: true,
  },
  {
    id: "posthog",
    title: "Posthog",
    subTitle: "Campaign: Onboarding Campaign",
    disabled: false,
  },
  {
    id: "rudderstack",
    title: "Rudderstack",
    subTitle: "Campaign: Transactional Receipt",
    disabled: true,
  },
];

const smsMemoryOptions: Record<
  string,
  { id: string; name: string; inStock: boolean }
> = {
  twilio: { id: "twilio", name: "Twilio", inStock: true },
  vonage: { id: "vonage", name: "Vonage", inStock: false },
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const validators: { [key: string]: (value: string) => string | void } = {
  emailwithend: (value: string) => {
    if (value.match(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/)) {
      return "You shouldn't pass full email here.";
    }
  },
  email: (value: string) => {
    if (!value?.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
      return "You should pass email.";
    }
  },
};

const attributeKeys: { [key: string]: string } = {
  testSendingEmail: "emailwithend",
};

const expectedFields: Record<string, string[]> = {
  free3: ["testSendingEmail", "testSendingName"],
  mailgun: ["sendingName", "sendingEmail"],
  sendgrid: ["sendgridApiKey", "sendgridFromEmail"],
};

const tabNames = ["Channels", "Events", "Customers"];

interface IntegrationsData {
  sendingName: string;
  sendingEmail: string;
  testSendingEmail: string;
  testSendingName: string;
  slackId: string;
  eventProvider: string;
  emailProvider: string;
  mailgunAPIKey: string;
  posthogApiKey: string;
  posthogProjectId: string;
  posthogHostUrl: string;
  posthogSmsKey: string;
  posthogEmailKey: string;
  sendgridApiKey: string;
  sendgridFromEmail: string;
  smsAccountSid: string;
  smsAuthToken: string;
  smsFrom: string;
}

export default function OnboardingBeta() {
  const navigate = useNavigate();
  const { settings, domainsList } = useTypedSelector((state) => state.settings);
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({
    sendingName: "",
    sendingEmail: "",
    testSendingEmail: "",
    testSendingName: "",
    slackId: "",
    mailgunAPIKey: "",
    eventProvider: "posthog",
    emailProvider: "",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHostUrl: "app.posthog.com",
    posthogSmsKey: "",
    posthogEmailKey: "",
    sendgridApiKey: "",
    sendgridFromEmail: "",
    smsAccountSid: "",
    smsAuthToken: "",
    smsFrom: "",
  });
  const [userApiKey, setUserApiKey] = useState("");

  const [stepsCompletion, setStepsCompletion] = useState([false, false, false]);

  const dispatch = useDispatch();
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");
  const [domainName, setDomainName] = useState<string>(
    settings.domainName || ""
  );
  const [domainList, setDomainList] = useState<{ name: string }[]>(
    domainsList || []
  );
  const [privateApiKey, setPrivateApiKey] = useState<string>("");
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    [key: string]: string | undefined;
  }>({});
  const [verified, setVerified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

  const [smsProvider, setSmsProvider] = useState("twilio");
  const smsMem = smsMemoryOptions[smsProvider];
  const [showErrors, setShowErrors] = useState({
    smsAccountSid: false,
    smsAuthToken: false,
    smsFrom: false,
  });

  const [smsErrors, setSmsErrors] = useState<{
    [key: string]: string[];
  }>({
    smsAccountSid: [],
    smsAuthToken: [],
    smsFrom: [],
  });
  const [possibleNumbers, setPossibleNumbers] = useState<string[]>([]);

  useEffect(() => {
    const newSmsErrors: { [key: string]: string[] } = {
      smsAccountSid: [],
      smsAuthToken: [],
      smsFrom: [],
    };

    if (!integrationsData.smsAccountSid) {
      newSmsErrors.smsAccountSid.push("Account sid must be defined");
    }

    if (!integrationsData.smsAuthToken) {
      newSmsErrors.smsAuthToken.push("Auth token must be defined");
    }

    if (!integrationsData.smsFrom) {
      newSmsErrors.smsFrom.push("Sms from must be defined");
    }
    setSmsErrors(newSmsErrors);
  }, [integrationsData]);

  const loadPossibleNumbers = async (
    smsAccountSid: string,
    smsAuthToken: string
  ) => {
    const { data } = await ApiService.get({
      url: `/sms/possible-phone-numbers?smsAccountSid=${smsAccountSid}&smsAuthToken=${smsAuthToken}`,
    });

    setPossibleNumbers(data || []);
  };

  useDebounce(
    () => {
      if (integrationsData.smsAccountSid && integrationsData.smsAuthToken)
        loadPossibleNumbers(
          integrationsData.smsAccountSid,
          integrationsData.smsAuthToken
        );
    },
    1000,
    [integrationsData]
  );

  const handleFormDataChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.target.value.includes(" ")) {
      e.target.value = e.target.value.replaceAll(" ", "");
      toast.error("Value should not contain spaces!", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSMSBlur = (e: FocusEvent<HTMLSelectElement>) => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const isSMSError = Object.values(smsErrors).some((item) => item.length > 0);

  const callDomains = async () => {
    if (privateApiKey) {
      dispatch(setSettingsPrivateApiKey(privateApiKey));
      const response = await dispatch(setDomainsList(privateApiKey));
      if (response?.data) {
        setDomainList(response?.data);
      }
    }
  };

  useLayoutEffect(() => {
    const func = async () => {
      const { data } = await ApiService.get({
        url: `${ApiConfig.slackInstall}`,
      });
      setSlackInstallUrl(data);
    };
    func();
  }, []);

  const loadData = async () => {
    const { data } = await ApiService.get({ url: "/accounts" });
    const {
      sendingName,
      sendingEmail,
      slackTeamId,
      mailgunAPIKey,
      posthogApiKey,
      posthogProjectId,
      posthogHostUrl,
      posthogSmsKey,
      posthogEmailKey,
      emailProvider,
      testSendingEmail,
      testSendingName,
      sendingDomain,
      verified: verifiedFromRequest,
      sendgridApiKey,
      sendgridFromEmail,
      smsAccountSid,
      smsAuthToken,
      smsFrom,
      apiKey,
    } = data;
    setIntegrationsData({
      ...integrationsData,
      posthogApiKey: posthogApiKey || integrationsData.posthogApiKey,
      posthogProjectId: posthogProjectId || integrationsData.posthogProjectId,
      posthogHostUrl: posthogHostUrl || integrationsData.posthogHostUrl,
      posthogSmsKey: posthogSmsKey || integrationsData.posthogSmsKey,
      posthogEmailKey: posthogEmailKey || integrationsData.posthogEmailKey,
      sendingName: sendingName || integrationsData.sendingName,
      sendingEmail: sendingEmail || integrationsData.sendingEmail,
      emailProvider: emailProvider || integrationsData.emailProvider,
      testSendingEmail: testSendingEmail || integrationsData.testSendingEmail,
      testSendingName: testSendingName || integrationsData.testSendingName,
      slackId: slackTeamId?.[0] || integrationsData.slackId,
      sendgridApiKey: sendgridApiKey || integrationsData.sendgridApiKey,
      sendgridFromEmail:
        sendgridFromEmail || integrationsData.sendgridFromEmail,
      smsAccountSid: smsAccountSid || integrationsData.smsAccountSid,
      smsAuthToken: smsAuthToken || integrationsData.smsAuthToken,
      smsFrom: smsFrom || integrationsData.smsFrom,
    });
    setPrivateApiKey(mailgunAPIKey);
    setDomainName(sendingDomain);
    setVerified(verifiedFromRequest);
    const isStepOneFinished = !!emailProvider || !!smsAccountSid;
    const isStepTwoFinished = !!posthogApiKey;
    setCurrentStep(isStepTwoFinished ? 2 : isStepOneFinished ? 1 : 0);
    setStepsCompletion([isStepOneFinished, isStepTwoFinished, false]);
    setUserApiKey(apiKey);
  };

  useEffect(() => {
    loadData();
  }, []);

  const errorCheck = (e: {
    target: {
      name?: string;
      value?: string;
      custattribute?: string;
      getAttribute?: (str: string) => string | undefined;
    };
  }) => {
    let newError: string | void = undefined;
    if (!e.target.value) {
      newError = "Field can't be empty.";
    }
    const attribute =
      e.target?.getAttribute?.("data-spectype") || e.target?.custattribute;

    if (!newError && attribute && validators[attribute]) {
      newError = validators[attribute](e.target.value || "");
    }

    setErrors((prev) => ({
      ...prev,
      [e.target.name || ""]: newError as string,
    }));
    return !!newError;
  };

  const handleBlur = (e: {
    target: {
      name?: string;
      value?: string;
      custattribute?: string;
      getAttribute?: (str: string) => string | undefined;
    };
  }) => {
    errorCheck(e);
  };

  const handleIntegrationsDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (
      !["sendingName", "testSendingName"].includes(e.target.name) &&
      e.target.value.includes(" ")
    ) {
      e.target.value = e.target.value.replaceAll(" ", "");
      toast.error("Value should not contain spaces!", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
    errorCheck(
      e as {
        target: {
          name?: string;
          value?: string;
          custattribute?: string;
          getAttribute?: (str: string) => string | undefined;
        };
      }
    );
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    const objToSend: Record<string, string> = {};
    for (const key of Object.keys(integrationsData)) {
      if (integrationsData[key as keyof IntegrationsData])
        objToSend[key] = integrationsData[key as keyof IntegrationsData];
    }

    let skip = false;

    if (integrationsData.emailProvider) {
      for (const key of expectedFields[integrationsData.emailProvider]) {
        if (
          errorCheck({
            target: {
              name: key,
              value: integrationsData?.[key as keyof IntegrationsData],
              custattribute: attributeKeys[key],
            },
          })
        ) {
          skip = true;
        }
      }
    }

    if (skip) {
      toast.error("Please check passed data", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: {
          ...objToSend,
          sendingDomain: domainName,
          mailgunAPIKey: privateApiKey,
        },
      });
      await loadData();
    } catch (e) {
      let message = "Unexpected error";
      if (e instanceof AxiosError) message = e.response?.data?.message;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const parametersToConfigure: { [key: string]: React.ReactElement } = {
    posthog: (
      <form className="flex flex-col gap-[10px]">
        <Input
          isRequired
          value={integrationsData.posthogApiKey}
          label="Private API Key"
          placeholder={"****  "}
          name="posthogApiKey"
          id="posthogApiKey"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <Input
          isRequired
          value={integrationsData.posthogProjectId}
          label="Project Id"
          placeholder={"****  "}
          name="posthogProjectId"
          id="posthogProjectId"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <Input
          isRequired
          value={integrationsData.posthogHostUrl}
          label="Posthog Url"
          placeholder={"https://app.posthog.com"}
          name="posthogHostUrl"
          id="posthogHostUrl"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <Input
          isRequired
          value={integrationsData.posthogSmsKey}
          label="Name of SMS / Phone number field on your Posthog person"
          placeholder={"$phoneNumber"}
          name="posthogSmsKey"
          id="posthogSmsKey"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <Input
          isRequired
          value={integrationsData.posthogEmailKey}
          label="Name of Email address field on your Posthog person"
          placeholder={"$email"}
          name="posthogEmailKey"
          id="posthogEmailKey"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
      </form>
    ),
    mailgun: (
      <>
        <Input
          isRequired
          value={privateApiKey}
          label="Private API Key"
          placeholder={"****  "}
          name="privateApiKey"
          id="privateApiKey"
          type="password"
          labelClass="!text-[16px]"
          onChange={(e) => {
            setPrivateApiKey(e.target.value);
            handleIntegrationsDataChange(e);
          }}
          isError={!!errors["privateApiKey"]}
          errorText={errors["privateApiKey"]}
          onBlur={(e) => {
            callDomains();
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            );
          }}
        />
        <Select
          id="activeJourney"
          value={domainName}
          options={domainList.map((item) => ({
            value: item.name,
          }))}
          onChange={(value) => {
            setDomainName(value);
          }}
          displayEmpty
          renderValue={(val) => val}
          sx={{
            height: "44px",
            margin: "20px 0px",
          }}
          inputProps={{
            "& .MuiSelect-select": {
              padding: "9px 15px",
              border: "1px solid #DEDEDE",
              boxShadow: "none",
              borderRadius: "3px",
            },
            sx: {
              borderRadius: "6px !important",
            },
          }}
        />
        <Input
          name="sendingName"
          id="sendingName"
          label="Sending name"
          value={integrationsData.sendingName}
          isError={!!errors["sendingName"]}
          errorText={errors["sendingName"]}
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <div className="relative">
          <Input
            name="sendingEmail"
            id="sendingEmail"
            label="Sending email"
            value={integrationsData.sendingEmail}
            onChange={handleIntegrationsDataChange}
            className="pr-[150px]"
            isError={!!errors["sendingEmail"]}
            errorText={errors["sendingEmail"]}
            endText={domainName ? "@laudspeaker.com" : ""}
            onBlur={(e) =>
              handleBlur(
                e as {
                  target: {
                    name?: string;
                    value?: string;
                    custattribute?: string;
                    getAttribute?: (str: string) => string | undefined;
                  };
                }
              )
            }
          />
        </div>
      </>
    ),
    free3: (
      <>
        <Input
          name="testSendingName"
          id="testSendingName"
          label="Sending name"
          isError={!!errors["testSendingName"]}
          errorText={errors["testSendingName"]}
          value={integrationsData.testSendingName}
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
        <div className="relative">
          <Input
            name="testSendingEmail"
            id="testSendingEmail"
            label="Sending email"
            data-spectype="emailwithend"
            value={integrationsData.testSendingEmail}
            onChange={handleIntegrationsDataChange}
            isError={!!errors["testSendingEmail"]}
            errorText={errors["testSendingEmail"]}
            className="pr-[210px]"
            endText={"@laudspeaker-test.com"}
            onBlur={(e) =>
              handleBlur(
                e as {
                  target: {
                    name?: string;
                    value?: string;
                    custattribute?: string;
                    getAttribute?: (str: string) => string | undefined;
                  };
                }
              )
            }
          />
        </div>
      </>
    ),
    sendgrid: (
      <>
        <Input
          isRequired
          value={integrationsData.sendgridApiKey}
          label="Private sendgrid API Key"
          placeholder={"****  "}
          name="sendgridApiKey"
          id="sendgridApiKey"
          type="password"
          isError={!!errors["sendgridApiKey"]}
          errorText={errors["sendgridApiKey"]}
          labelClass="!text-[16px]"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) => {
            callDomains();
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            );
          }}
        />
        <Input
          isRequired
          value={integrationsData.sendgridFromEmail}
          label="Sendgrid email"
          placeholder={"your.email@sendgrid.com"}
          name="sendgridFromEmail"
          id="sendgridFromEmail"
          isError={!!errors["sendgridFromEmail"]}
          errorText={errors["sendgridFromEmail"]}
          type="text"
          labelClass="!text-[16px]"
          onChange={handleIntegrationsDataChange}
          onBlur={(e) =>
            handleBlur(
              e as {
                target: {
                  name?: string;
                  value?: string;
                  custattribute?: string;
                  getAttribute?: (str: string) => string | undefined;
                };
              }
            )
          }
        />
      </>
    ),
  };

  const frameOne: CSS.Properties = {
    position: "relative",
    height: "80vh",
  };

  const frameTwo: CSS.Properties = {
    height: "100%",
    width: "100%",
  };

  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const requiredKeys = expectedFields[integrationsData.emailProvider];
    if (!requiredKeys) return;
    const requiredValues = requiredKeys.map((key) => !errors[key]);
    setIsError(requiredValues.some((value) => !value));

    if (integrationsData.emailProvider) {
      for (const key of expectedFields[integrationsData.emailProvider]) {
        errorCheck({
          target: {
            name: key,
            value: integrationsData[key as keyof IntegrationsData],
            custattribute: attributeKeys[key],
          },
        });
      }
    }
  }, [integrationsData]);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: {
          posthogApiKey: integrationsData.posthogApiKey || "",
          posthogProjectId: integrationsData.posthogProjectId || "",
          posthogHostUrl: integrationsData.posthogHostUrl || "",
        },
      });
      await startPosthogImport();
      navigate("/");
    } catch (e) {
      toast.error("Error while import");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      label: "01",
      name: "Add channels",
      href: "#",
      component: (
        <>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Email
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add an email sending service to automatically send emails to
                  your customers.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <form action="#" method="POST">
                <div className="overflow-visible shadow sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <h2>Email configuration</h2>
                    <Select
                      id="email_config_select"
                      options={allEmailChannels.map((item) => ({
                        value: item.id,
                        title: item.title,
                        disabled:
                          item.id === "free3" && !verified
                            ? true
                            : item.disabled,
                        tooltip:
                          item.id === "free3" && !verified
                            ? "You need to verify your email"
                            : item.tooltip,
                      }))}
                      placeholder="select your email sending service"
                      value={integrationsData.emailProvider}
                      onChange={(value: string) => {
                        setIntegrationsData({
                          ...integrationsData,
                          emailProvider: value,
                        });
                        setErrors({});
                      }}
                    />

                    {integrationsData.emailProvider && (
                      <>
                        <h3 className="flex items-center text-[18px] font-semibold leading-[40px] mb-[10px]">
                          {integrationsData.emailProvider
                            .charAt(0)
                            .toUpperCase() +
                            integrationsData.emailProvider.slice(1)}{" "}
                          Configuration
                        </h3>
                        {parametersToConfigure[integrationsData.emailProvider]}
                      </>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <GenericButton
                      id="saveEmailConfiguration"
                      onClick={handleSubmit}
                      customClasses="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      disabled={isError || isLoading}
                    >
                      Save
                    </GenericButton>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  SMS
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add an sms sending service to automatically send sms to your
                  customers.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <form action="#" method="POST">
                <div className="overflow-visible shadow sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <h2>SMS configuration</h2>
                    <div className="mt-10 divide-y divide-gray-200">
                      <div className="space-y-10">
                        <RadioGroup
                          value={smsMem}
                          onChange={(m) => setSmsProvider(m.id)}
                          className="mt-2"
                        >
                          <RadioGroup.Label className="sr-only">
                            Choose a memory option
                          </RadioGroup.Label>
                          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {Object.values(smsMemoryOptions).map((option) => (
                              <RadioGroup.Option
                                key={option.name}
                                value={option}
                                className={({ active, checked }) =>
                                  classNames(
                                    option.inStock
                                      ? "cursor-pointer focus:outline-none"
                                      : "opacity-25 cursor-not-allowed",
                                    active
                                      ? "ring-2 ring-offset-2 ring-cyan-500"
                                      : "",
                                    checked
                                      ? "bg-cyan-600 border-transparent text-white hover:bg-cyan-700"
                                      : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                                    "border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium sm:flex-1"
                                  )
                                }
                                disabled={!option.inStock}
                              >
                                <RadioGroup.Label as="span">
                                  {option.name}
                                </RadioGroup.Label>
                              </RadioGroup.Option>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="mt-6">
                        <dl className="divide-y divide-gray-200">
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500">
                              Twillio account sid
                            </dt>
                            <dd>
                              <div className="relative rounded-md min-w-[260px]">
                                <Input
                                  type="text"
                                  value={integrationsData.smsAccountSid}
                                  onChange={handleFormDataChange}
                                  name="smsAccountSid"
                                  id="smsAccountSid"
                                  className={`rounded-md shadow-sm sm:text-sm ${
                                    showErrors.smsAccountSid &&
                                    smsErrors.smsAccountSid.length > 0
                                      ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                                      : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                                  }`}
                                  onBlur={handleSMSBlur}
                                />
                                {showErrors.smsAccountSid &&
                                  smsErrors.smsAccountSid.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                              </div>
                              {showErrors.smsAccountSid &&
                                smsErrors.smsAccountSid.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                            </dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500">
                              Twillio auth token
                            </dt>
                            <dd>
                              <div className="relative rounded-md min-w-[260px]">
                                <Input
                                  type="text"
                                  value={integrationsData.smsAuthToken}
                                  onChange={handleFormDataChange}
                                  name="smsAuthToken"
                                  id="smsAuthToken"
                                  className={`rounded-md shadow-sm sm:text-sm ${
                                    showErrors.smsAuthToken &&
                                    smsErrors.smsAuthToken.length > 0
                                      ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                                      : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                                  }`}
                                  onBlur={handleSMSBlur}
                                />
                                {showErrors.smsAuthToken &&
                                  smsErrors.smsAuthToken.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                              </div>
                              {showErrors.smsAuthToken &&
                                smsErrors.smsAuthToken.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                            </dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500">
                              Sms From
                            </dt>
                            <dd>
                              <div className="relative rounded-md min-w-[260px]">
                                <select
                                  id="smsFrom"
                                  name="smsFrom"
                                  disabled={
                                    !integrationsData.smsAccountSid ||
                                    !integrationsData.smsAuthToken ||
                                    possibleNumbers.length === 0
                                  }
                                  value={integrationsData.smsFrom}
                                  onChange={handleFormDataChange}
                                  className={`mt-1 block w-full rounded-md py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm ${
                                    smsErrors.smsFrom.length > 0 &&
                                    showErrors.smsFrom
                                      ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                                      : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                                  }`}
                                  onBlur={handleSMSBlur}
                                >
                                  <option value={integrationsData.smsFrom}>
                                    {integrationsData.smsFrom}
                                  </option>
                                  {possibleNumbers.map((item) => (
                                    <option value={item}>{item}</option>
                                  ))}
                                </select>
                                {showErrors.smsFrom &&
                                  smsErrors.smsFrom.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                              </div>
                              {showErrors.smsFrom &&
                                smsErrors.smsFrom.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <GenericButton
                      id="saveEmailConfiguration"
                      onClick={handleSubmit}
                      customClasses="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      disabled={isSMSError || isLoading}
                    >
                      Save
                    </GenericButton>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Slack
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Install the Laudspeaker Slack App to automatically send
                  triggered Slack messages to your customers.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <form action="#" method="POST">
                <div className="shadow sm:overflow-hidden sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <h2>Slack configuration</h2>
                    <a
                      href={slackInstallUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <img
                        alt="add to slack"
                        src="https://platform.slack-edge.com/img/add_to_slack.png"
                        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                        width="139"
                        height="40"
                      />
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>
        </>
      ),
    },
    {
      label: "02",
      name: "Add events",
      href: "#",
      component: (
        <>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Events
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure your event provider to send event data to
                  Laudspeaker so you can send triggered messages.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <form action="#" method="POST">
                <div className="shadow sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <h2>Events configuration</h2>
                    <Select
                      id="events_config_select"
                      options={allEventChannels.map((item) => ({
                        value: item.id,
                        title: item.title,
                        disabled: item.disabled,
                      }))}
                      value={integrationsData.eventProvider}
                      onChange={(value: string) =>
                        setIntegrationsData({
                          ...integrationsData,
                          eventProvider: value,
                        })
                      }
                    />
                    {integrationsData.eventProvider && (
                      <>
                        <h3 className="flex items-center text-[18px] font-semibold leading-[40px] mb-[10px]">
                          {integrationsData.eventProvider
                            .charAt(0)
                            .toUpperCase() +
                            integrationsData.eventProvider.slice(1)}{" "}
                          Configuration
                        </h3>
                        {parametersToConfigure[integrationsData.eventProvider]}
                      </>
                    )}
                  </div>
                </div>
              </form>
              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Test event
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  If you want to just test an event, copy this javascript
                  snippet and add it below whereever you are tracking events on
                  your site currently
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <div>
                <div className="shadow sm:rounded-md">
                  <SnippetPicker userApiKey={userApiKey} />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      label: "03",
      name: "Add customers (optional)",
      href: "#",
      component: (
        <>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 p-5">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Events
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure your event provider to send event data to
                  Laudspeaker so you can send triggered messages.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 pd-5">
              <form action="#" method="POST">
                <div className="shadow sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <h2>Events configuration</h2>
                    <Select
                      id="events_config_select"
                      options={allEventChannels.map((item) => ({
                        value: item.id,
                        title: item.title,
                        disabled: item.disabled,
                      }))}
                      value={integrationsData.eventProvider}
                      onChange={(value: string) =>
                        setIntegrationsData({
                          ...integrationsData,
                          eventProvider: value,
                        })
                      }
                    />
                    {integrationsData.eventProvider && (
                      <>
                        <h3 className="flex items-center text-[18px] font-semibold leading-[40px] mb-[10px]">
                          {integrationsData.eventProvider
                            .charAt(0)
                            .toUpperCase() +
                            integrationsData.eventProvider.slice(1)}{" "}
                          Configuration
                        </h3>
                        {parametersToConfigure[integrationsData.eventProvider]}
                      </>
                    )}
                  </div>
                </div>
              </form>
              <div className="flex justify-end items-center gap-[10px] bg-gray-50 px-4 py-3 text-right sm:px-6">
                <GenericButton
                  customClasses="grayscale"
                  onClick={() => navigate("/")}
                >
                  Skip
                </GenericButton>
                <button
                  type="button"
                  onClick={() =>
                    toast.promise(handleSync, {
                      pending: { render: "Sync in progress!", type: "info" },
                      success: { render: "Sync success!", type: "success" },
                      error: { render: "Sync failed!", type: "error" },
                    })
                  }
                  disabled={isError || isLoading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Sync
                </button>
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-full">
        <div className="flex flex-1 flex-col">
          <Header />
          {!verified && (
            <div className="flex items-center py-[10px] px-[10px] md:px-[30px] bg-[#fffde9]">
              <ExclamationTriangleIcon className="w-[30px] h-[30px] text-[#ffe30c] mr-[20px]" />
              <div className="w-full flex flex-col">
                <span className="text-[#f3c276] text-[18px] leading-[24px] font-medium">
                  Email not verified.
                </span>
                <span className="text-[#f6d077] text-[14px] leading-[18px]">
                  Please check your inbox to verify your email. Once you have
                  you can test email sending. If you need to resend the email
                  verification go to{" "}
                  <Link to="/settings">
                    <u>settings.</u>
                  </Link>
                </span>
              </div>
            </div>
          )}
          {/* Navigation */}
          <nav aria-label="Progress">
            <ol
              role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {stepsCompletion[stepIdx] ? (
                    <a
                      href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIcon
                            className="h-6 w-6 text-white"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : stepIdx === currentStep ? (
                    <a
                      href="#"
                      onClick={() => {
                        setCurrentStep(stepIdx);
                        loadData();
                      }}
                      className="flex items-center px-6 py-4 text-sm font-medium"
                      aria-current="step"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                        <span className="text-indigo-600">{step.label}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-indigo-600">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">
                            {step.label}
                          </span>
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div
                        className="absolute top-0 right-0 hidden h-full w-5 md:block"
                        aria-hidden="true"
                      >
                        <svg
                          className="h-full w-full text-gray-300"
                          viewBox="0 0 22 80"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0 -2L20 40L0 82"
                            vectorEffect="non-scaling-stroke"
                            stroke="currentcolor"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
          <main className="flex-1 pb-8">
            <div className="grid place-items-center pt-6">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                onClick={redirectUses}
              >
                Check Out Onboarding Video
              </button>
            </div>
            <Modal
              isOpen={nameModalOpen}
              panelClass="max-w-[90%]"
              onClose={() => {
                setNameModalOpen(false);
              }}
            >
              <div style={frameOne}>
                <iframe
                  src="https://www.loom.com/embed/be35f72bd1d04dc5a9c972d2b92c82f8"
                  frameBorder="0"
                  style={frameTwo}
                ></iframe>
              </div>
            </Modal>
            <div className="px-4 sm:px-6 lg:mx-auto lg:max-w-6xl lg:px-8">
              <div className="lg:hidden">
                <label htmlFor="selected-tab" className="sr-only">
                  Select a tab
                </label>
                <select
                  id="selected-tab"
                  name="selected-tab"
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                  value={currentStep}
                  onChange={(e) => {
                    setCurrentStep(+e.currentTarget.value);
                  }}
                >
                  {[0, 1, 2].map((tab) => (
                    <option key={tab} value={tab}>
                      {tabNames[tab]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden lg:block">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[0, 1, 2].map((tab) => (
                      <div
                        key={tab}
                        className={classNames(
                          tab === currentStep
                            ? "border-cyan-500 text-cyan-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                          "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer"
                        )}
                        onClick={() => {
                          setCurrentStep(tab);
                        }}
                      >
                        {tabNames[tab]}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"></div>
              {steps[currentStep].component}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
