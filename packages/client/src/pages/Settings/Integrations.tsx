import Header from "components/Header";
import { ApiConfig } from "../../constants";
import React, { useEffect, useLayoutEffect, useState } from "react";
import ApiService from "services/api.service";
import Input from "../../components/Elements/Input";
import Select from "../../components/Elements/Select";
import { allChannels } from "./EventsProv";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setDomainsList, setSettingsPrivateApiKey } from "reducers/settings";
import { useDispatch } from "react-redux";

interface IntegrationsData {
  sendingName: string;
  sendingEmail: string;
  slackId: string;
  eventProvider: string;
}

const Integrations = () => {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({
    sendingName: "",
    sendingEmail: "",
    slackId: "",
    eventProvider: "posthog",
  });
  const dispatch = useDispatch();
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");
  const [domainName, setDomainName] = useState<any>(settings.domainName || "");
  const [domainList, setDomainList] = useState<any>(domainsList || []);
  const [privateApiKey, setPrivateApiKey] = useState<string>(
    settings.privateApiKey || ""
  );

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

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { sendingName, sendingEmail, slackTeamId } = data;
      setIntegrationsData({
        ...integrationsData,
        sendingName,
        sendingEmail,
        slackId: slackTeamId?.[0],
      });
    })();
  }, []);

  const handleIntegrationsDataChange = (e: any) => {
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div className="flex-col">
        <Header />
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Email
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:overflow-visible sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Email configuration</h2>
                  <Input
                    name="sendingName"
                    id="sendingName"
                    label="Sending name"
                    value={integrationsData.sendingName}
                    className="border-black border-[1px]"
                    onChange={handleIntegrationsDataChange}
                  />
                  <Input
                    name="sendingEmail"
                    id="sendingEmail"
                    label="Sending email"
                    value={integrationsData.sendingEmail}
                    className="border-black border-[1px]"
                    onChange={handleIntegrationsDataChange}
                  />
                  <Input
                    isRequired
                    value={privateApiKey}
                    label="Private API Key"
                    placeholder={"****  "}
                    name="privateApiKey"
                    id="privateApiKey"
                    type="password"
                    style={{
                      maxWidth: "530px",
                      padding: "15px 16px 15px 16px",
                      background: "#fff",
                      border: "1px solid #D1D5DB",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontSize: "16px",
                    }}
                    labelClass="!text-[16px]"
                    onChange={(e) => {
                      setPrivateApiKey(e.target.value);
                      handleIntegrationsDataChange(e);
                    }}
                    onBlur={callDomains}
                  />
                  <Select
                    id="activeJourney"
                    value={domainName}
                    options={domainList.map((item: any) => ({
                      value: item.name,
                    }))}
                    onChange={(value) => {
                      setDomainName(value);
                    }}
                    displayEmpty
                    renderValue={(val: any) => val}
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
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="md:grid md:grid-cols-3 md:gap-6 border-t-[1px]">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Slack
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
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
        <div className="md:grid md:grid-cols-3 md:gap-6 border-t-[1px]">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Events
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
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
                    options={allChannels.map((item: any) => ({
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
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Integrations;
